const errorHandler = (err, req, res, next) => {
    // Set default status code if not set
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

export default errorHandler;