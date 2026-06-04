# SCALVEA E-Commerce Platform

A full-stack international e-commerce platform for SCALVEA hair care products with multi-country pricing, Stripe payments, inventory management, and admin dashboard.

---

## 🌍 Overview

SCALVEA is a modern international e-commerce platform built for selling hair care products globally. The platform supports multi-country pricing, multi-currency payments, inventory management, admin dashboard, and international shipping logic.

The system supports:
- Australia (AUD)
- India (INR)

Prices, taxes, shipping charges, and delivery time change based on the selected country.

---

## 🚀 Features

### User Features
- User Registration & Login
- Country Selection (India / Australia)
- Multi-Currency Pricing
- Product Browsing
- Product Details Page
- Add to Cart
- Wishlist
- Checkout
- Stripe Payments
- Order History
- Address Management
- Email Order Confirmation
- Delivery Time per Country
- Taxes & Shipping Calculation
- Coupons / Discount Codes
- Product Reviews

### Admin Features
- Admin Dashboard
- Product Management
- Inventory Management
- Order Management
- User Management
- Country Pricing Management
- Taxes Management per Country
- Shipping Charges per Country
- Coupons Management
- Sales Analytics
- Low Stock Alerts
- Revenue by Country

---

## 🛠 Tech Stack

### Frontend
- Next.js
- React
- Tailwind CSS
- Redux Toolkit / Context API
- Stripe JS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Stripe API
- Cloudinary (Image Upload)
- Nodemailer / Resend (Emails)

### Deployment
- Frontend → Vercel
- Backend → Render / Railway
- Database → MongoDB Atlas
- Images → Cloudinary
- Payments → Stripe

---

## 📁 Project Structure

scalvea/
│
├── frontend/ # Next.js frontend
│
├── backend/
│ ├── controllers/
│ ├── routes/
│ ├── models/
│ ├── middleware/
│ ├── utils/
│ ├── config/
│ └── server.js
│
├── admin/ # Admin dashboard
│
├── .env
├── .gitignore
├── README.md
└── package.json


---

## 🗄 Database Models

The system includes the following database models:

- Users
- Products
- ProductPrices
- Orders
- OrderItems
- Inventory
- CountrySettings
- Coupons
- Reviews
- Addresses
- InventoryLogs

---

## 🌎 Multi-Country Logic

The platform supports different pricing, taxes, and shipping per country.

| Country | Currency |
|--------|----------|
| Australia | AUD |
| India | INR |

### Checkout Calculation

Subtotal = Product Prices (based on country)
Tax = Subtotal × Country Tax %
Shipping = Country Shipping Charge
Total = Subtotal + Tax + Shipping


---

## 💳 Stripe Payment Integration

Stripe is used for handling international payments.

Supported currencies:
- AUD
- INR
- USD

Payment Flow:
1. User selects country
2. Prices loaded based on country
3. User checkout
4. Backend creates Stripe PaymentIntent
5. User pays
6. Stripe webhook confirms payment
7. Order marked as paid
8. Inventory updated
9. Confirmation email sent

---

## 🔐 Authentication & Security

- JWT Authentication
- Password Hashing (bcrypt)
- Protected Admin Routes
- Rate Limiting
- Helmet Security
- Input Validation
- Stripe Webhook Verification

---

## 📦 Admin Panel Features

Admin dashboard includes:
- Total Orders
- Total Revenue
- Sales Analytics
- Revenue by Country
- Product Management
- Inventory Management
- Order Management
- User Management
- Coupons
- Taxes Management
- Shipping Management
- Country Pricing Management

---

## ⚙️ Environment Variables

Create a `.env` file in backend:

PORT=5000
MONGO_URI=
JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=


---

## ▶️ Installation & Setup

### Backend Setup

cd backend
npm install
npm run dev


### Frontend Setup

cd frontend
npm install
npm run dev


### Admin Panel Setup

cd admin
npm install
npm run dev

---

## 📊 Future Improvements

- Subscription Products
- Hair Consultation AI
- Mobile App
- Referral System
- Loyalty Points
- Abandoned Cart Emails
- Blog & SEO System
- Multi-language Support
- Warehouse Management
- Returns & Refund System

---

## 📞 Store Information

**SCALVEA**
263 Heaths Rd  
Werribee VIC 3030  
Australia  
+61 460 309 333

---

## 📄 License
This project is proprietary and developed for SCALVEA.
