/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/planillas/hospital-italiano': [
      './node_modules/pdfkit/**/*',
      './node_modules/fontkit/**/*',
      './node_modules/@foliojs-fork/**/*',
    ],
  },
}

module.exports = nextConfig
