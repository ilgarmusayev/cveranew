# CVera - Professional CV Platform

CVera is a modern, professional CV platform built with Next.js 15, TypeScript, and Tailwind CSS. It allows users to create, manage, and export professional CVs with LinkedIn import capabilities, template selection, and subscription management.

## Features

- **Authentication System**: JWT-based authentication with refresh tokens
- **CV Management**: Create, edit, and delete CVs with rich JSON data structure
- **LinkedIn Import**: Scrape LinkedIn profiles with API key rotation
- **Template System**: Tiered templates based on subscription level (Free/Medium/Premium)
- **Subscription Management**: Subscription tiers with epoint.az payment integration
- **File Generation**: PDF and DOCX export with Puppeteer and docx library
- **Real-time Preview**: Live CV preview while editing
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MySQL (local development), PostgreSQL (production)
- **Authentication**: JWT with httpOnly cookies for refresh tokens
- **ORM**: Prisma
- **File Generation**: Puppeteer (PDF), docx (DOCX)
- **Payments**: epoint.az integration for Azerbaijan market
- **External APIs**: RapidAPI for LinkedIn scraping

## Getting Started

### Prerequisites

- Node.js 18+ (or 20+ recommended)
- MySQL (for local development)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lastcvera
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/cvera"

# JWT Secrets
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# epoint.az Payment Gateway
EPOINT_MERCHANT_ID="your-merchant-id"
EPOINT_SECRET_KEY="your-secret-key"
EPOINT_BASE_URL="https://epoint.az/api/v1"

# RapidAPI for LinkedIn
RAPIDAPI_KEY="your-rapidapi-key"
RAPIDAPI_HOST="linkedin-scraper.p.rapidapi.com"
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

# Optional: Seed database with sample data
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── cvs/          # CV management
│   │   ├── import/       # LinkedIn import
│   │   ├── payments/     # Payment processing
│   │   └── webhooks/     # Payment webhooks
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── auth/             # Authentication forms
│   ├── cv/               # CV editor and preview
│   ├── dashboard/        # Dashboard components
│   ├── subscription/     # Subscription management
│   └── ui/               # UI components
├── lib/                   # Utility libraries
│   ├── api.ts            # API client
│   ├── auth.ts           # Authentication helpers
│   └── fileGeneration.ts # PDF/DOCX generation
└── types/                # TypeScript definitions
    └── cv.ts            # CV data types
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### CV Management
- `GET /api/cvs` - Get user's CVs
- `POST /api/cvs` - Create new CV
- `GET /api/cvs/[id]` - Get specific CV
- `PUT /api/cvs/[id]` - Update CV
- `DELETE /api/cvs/[id]` - Delete CV
- `POST /api/cvs/[id]/download` - Download CV as PDF/DOCX

### LinkedIn Import
- `POST /api/import/linkedin` - Import LinkedIn profile

### Templates
- `GET /api/templates` - Get available templates

### Subscriptions & Payments
- `POST /api/payments/create` - Create payment session
- `POST /api/subscriptions/[id]/cancel` - Cancel subscription
- `POST /api/webhooks/epointaz` - Handle payment webhooks

## Database Schema

The application uses Prisma ORM with the following main models:

- **User**: User accounts with authentication
- **CV**: CV data and metadata
- **Template**: CV templates with tier restrictions
- **Subscription**: User subscriptions
- **Payment**: Payment records
- **FileGenerationJob**: Async file generation tracking
- **ApiKey**: API key management for LinkedIn scraping

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

### Database Operations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Apply schema changes to database
npx prisma db push

# View database in Prisma Studio
npx prisma studio
```

## Deployment

### Environment Setup
1. Set up PostgreSQL database (Azure Database for PostgreSQL recommended)
2. Configure environment variables for production
3. Set up epoint.az merchant account for payments
4. Configure RapidAPI account for LinkedIn scraping

### Build and Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.
# cvera
# cvera
