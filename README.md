# SoFlo Wedding Venues

# Florida Wedding Wonders

A comprehensive Next.js application showcasing premium wedding venues across Florida. Built with modern technologies including TypeScript, Tailwind CSS, and a robust authentication system.

## 🌟 Features

### For Couples
- **Venue Discovery**: Browse through 124+ curated South Florida wedding venues
- **Detailed Venue Pages**: Comprehensive information including photos, amenities, pricing, and contact details
- **Advanced Filtering**: Search venues by location, capacity, price range, and amenities
- **Responsive Design**: Optimized experience across all devices
- **Contact System**: Easy communication with venue owners and our support team

### For Venue Owners
- **Listing Claims**: Claim existing venue listings for management access
- **Venue Management**: Update photos, pricing, availability, and venue information
- **Direct Inquiries**: Receive direct contact from couples planning their wedding
- **Analytics Dashboard**: Track listing performance and engagement metrics
- **Priority Placement**: Enhanced visibility in search results

### For Administrators
- **Admin Dashboard**: Comprehensive venue management system
- **Claims Management**: Review and approve venue listing claims
- **Venue Editing**: Full CRUD operations for venue data
- **User Management**: Manage venue owner accounts and permissions
- **Content Moderation**: Maintain quality standards across all listings

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FloridaWeddingWonders
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── claims/          # Claims management dashboard
│   │   └── page.tsx         # Main admin dashboard
│   ├── contact/             # Contact form and information
│   ├── venues/
│   │   ├── [id]/
│   │   │   ├── claim/       # Venue claim submission form
│   │   │   └── page.tsx     # Individual venue details
│   │   └── page.tsx         # Venue listings grid
│   ├── globals.css          # Global styles and Tailwind imports
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Homepage
├── components/
│   └── VenueCard.tsx        # Reusable venue card component
├── data/
│   ├── fallbackVenues.ts    # Fallback data for development
│   └── venues.json          # Comprehensive venue database
├── lib/
│   └── mockData.ts          # Data loading utilities
└── types/
    └── index.ts             # TypeScript type definitions
```

## 🛠 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **UI Library**: React 18 with modern hooks
- **Development**: Hot reload, ESLint, and Prettier
- **Deployment**: Optimized for Vercel deployment

## 📊 Venue Database

The application features a comprehensive database with 124 South Florida wedding venues including:

### Venue Information
- Name, description, and unique identifiers
- Complete address and location details
- Capacity ranges and guest accommodations
- Pricing tiers and package information
- Detailed amenity listings
- High-quality photo galleries
- Direct contact information

### Venue Categories
- **Beachfront**: Oceanside ceremonies and receptions
- **Historic**: Landmark venues with character
- **Gardens**: Lush outdoor wedding settings
- **Hotels**: Full-service hospitality venues
- **Estates**: Private luxury properties
- **Museums**: Unique cultural venues
- **Country Clubs**: Elegant golf course settings

## 🔧 Key Features Implementation

### Dynamic Routing
- `/venues` - Main venue listings with filtering
- `/venues/[id]` - Individual venue detail pages
- `/venues/[id]/claim` - Venue claim submission forms
- `/admin` - Administrative dashboard
- `/admin/claims` - Claims management system
- `/contact` - Contact form and information

### Admin Dashboard
- Real-time venue management
- Claim request review system
- Venue information editing with modal interface
- Search and filter functionality
- Responsive table layouts

### Claim System
- Secure venue ownership verification
- Multi-step claim submission process
- Administrative review workflow
- Email notification system (ready for integration)
- Status tracking and updates

## 🌐 Development Roadmap

- [x] Initial Next.js setup with TypeScript and Tailwind CSS
- [x] Comprehensive venue database (124 venues)
- [x] Venue listing and detail pages
- [x] Admin dashboard with full CRUD operations
- [x] Listing claims system
- [x] Contact form and support pages
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Authentication system (NextAuth.js)
- [ ] Payment integration (Stripe)
- [ ] Email notifications (SendGrid/Resend)
- [ ] Image upload and management
- [ ] SEO optimization
- [ ] Performance monitoring

## 🚀 Deployment

The application is optimized for deployment on Vercel:

```bash
npm run build
npm start
```

## 🤝 Contributing

This is a business project. Contribution guidelines will be established as the project develops.

## 📄 License

All rights reserved.

## 📞 Support

For questions or support:
- Email: hello@floridaweddingwonders.com
- Phone: (305) 555-0199
- Website: [floridaweddingwonders.com](https://floridaweddingwonders.com)

---

Built with ❤️ for couples planning their perfect South Florida wedding.
