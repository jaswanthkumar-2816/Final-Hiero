import winston from 'winston';

const errorHandler = (err, req, res, next) => {


  if (err.message.includes('latexmk')) {
    res.status(500).json({ error: 'Failed to generate PDF due to LaTeX compilation error. Please check your input data.' });
  } else if (err.message.includes('Invalid template')) {
    res.status(400).json({ error: 'Selected template is not available.' });
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Uploaded file exceeds 2MB limit.' });
  } else if (err.message.includes('Only PNG and JPEG')) {
    res.status(400).json({ error: 'Only PNG and JPEG images are allowed.' });
  } else {
    res.status(500).json({ error: 'Server error' });
  }
};

export default errorHandler;