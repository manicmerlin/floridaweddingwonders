# Super Admin System - SoFlo Wedding Venues

## 🔑 Super Admin Account

**Login Credentials:**
- Email: `admin@sofloweddingvenues.com`
- Password: `superadmin2025`

## 🚀 Super Admin Capabilities

### **Universal Venue Access**
- Can manage **ALL venues** on the platform
- No venue ownership restrictions
- 1000 photo limit (essentially unlimited)
- Enterprise-level features

### **Visual Indicators**
- **Navigation Bar**: Purple "🔑 SUPER ADMIN" badge
- **Venue Cards**: Purple "Manage" button on every venue
- **Management Interface**: "Super Admin - Manage Venue" header
- **Profile Badge**: Purple "SUPER ADMIN" tag instead of subscription tier

### **Enhanced Features**
- **Venue Browsing**: "Manage" button appears on all venue cards
- **Photo Management**: Upload unlimited photos to any venue
- **Easy Navigation**: "Browse All Venues" button in management interface
- **Global Access**: Can edit any venue's information, photos, and settings

## 📋 How to Use Super Admin

### **1. Login Process**
```
1. Go to /login
2. Enter: admin@sofloweddingvenues.com / superadmin2025
3. Automatically redirected to /venues (all venues page)
4. Super admin badge visible in navigation
```

### **2. Managing Venues**
```
1. Browse /venues page
2. Each venue card shows "View Details" + "Manage" buttons
3. Click "Manage" on any venue to edit it
4. Full access to photos, information, and settings
```

### **3. Photo Management**
```
1. Access any venue's management page
2. Go to "Photo Gallery" tab
3. Upload unlimited photos (1000 limit)
4. Set primary photos, delete photos, edit descriptions
5. Changes persist and appear on public venue pages
```

## 🔒 Security Features

### **Authentication Flow**
- Protected by middleware on `/venues/*/manage` routes
- Session management via cookies
- Role-based access control in authentication system

### **Access Control**
- Regular venue owners: Can only manage their specific venue
- Super admin: Can manage any venue on the platform
- Access denied screens for unauthorized users

## 🎯 Quick Access Methods

### **From Any Page**
1. Login as super admin
2. Navigate to /venues
3. Click "Manage" on any venue card

### **Direct URL Access**
- `/venues/11/manage` (Curtiss Mansion)
- `/venues/1/manage` (Hialeah Park)
- `/venues/[any-venue-id]/manage`

## 🔧 Technical Implementation

### **Auth System** (`src/lib/auth.ts`)
- `isSuperAdmin()` - Check if current user is super admin
- `canManageVenue()` - Returns true for all venues if super admin
- `getPhotoLimit()` - Returns 1000 for super admin

### **UI Components**
- `VenueCard.tsx` - Shows manage button for super admin
- `VenueManagement.tsx` - Super admin interface
- `Navigation.tsx` - Super admin badge display

### **Route Protection**
- `middleware.ts` - Protects management routes
- Automatic redirection for unauthorized access

## 📧 Demo Accounts Summary

| Role | Email | Password | Access |
|------|--------|-----------|---------|
| **Super Admin** | admin@sofloweddingvenues.com | superadmin2025 | All venues |
| Venue Owner | manager@curtissmansion.com | curtiss123 | Curtiss Mansion only |
| Venue Owner | owner@hialeahpark.com | hialeah123 | Hialeah Park only |
| System Admin | admin@soflowedding.com | soflo2025 | Admin dashboard |
| Guest | guest@example.com | guest123 | Guest features |

## 🎉 Ready to Use!

Your super admin system is fully implemented and ready for testing. Login with the super admin credentials to manage all venues on the platform!
