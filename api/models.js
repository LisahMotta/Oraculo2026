export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ error: 'GEMINI_API_KEY não configurada', key_present: false });
  }

  const keyPreview = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
    );
    const body = await response.json();
    return res.status(200).json({
      key_present: true,
      key_preview: keyPreview,
      key_length: apiKey.length,
      http_status: response.status,
      models: body.models?.map(m => m.name) ?? [],
      raw_error: body.error ?? null,
    });
  } catch (err) {
    return res.status(200).json({
      key_present: true,
      key_preview: keyPreview,
      network_error: err.message,
    });
  }
}
