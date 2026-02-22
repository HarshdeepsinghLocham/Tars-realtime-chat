# 🚀 Tars Real-Time Chat Application

A production-style real-time chat application built with modern full-stack technologies.

This project was developed as part of the **Tars Full Stack Engineer Internship Coding Challenge**.  
The focus was to build a clean, scalable, real-time system with production-ready UI — not just a functional demo.

---

## ✨ Features

- 🔐 Secure Authentication (Clerk)
- ⚡ Real-Time Messaging using Convex reactive queries
- 🚀 Optimistic UI updates for instant feedback
- 💬 WhatsApp-style Message Reactions
- 👥 Message Grouping for improved readability
- 🟢 Online Presence Indicators
- 🗑️ Message Deletion
- 🌙 Dark Mode UI
- 🎯 Smooth Animations (Framer Motion)
- 📦 Production Build Verified

---

## 🏗️ Tech Stack

### Frontend
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend
- Convex (Reactive database + real-time engine)

### Authentication
- Clerk

---

## 🧠 Architecture Overview

This application follows a **reactive architecture pattern**.

### Real-Time Strategy

Convex provides:
- Reactive queries
- Real-time data subscriptions
- Automatic client updates when data changes

Instead of manually managing WebSockets, the frontend subscribes to Convex queries.  
When a mutation occurs, Convex re-runs affected queries and pushes updates to connected clients automatically.

This keeps the frontend declarative and avoids complex socket state handling.

---

### Optimistic UI

Messages are rendered optimistically before backend confirmation.

**Benefits:**
- Instant user feedback
- Improved perceived performance
- Cleaner interaction flow

If a mutation fails, the UI can safely roll back.

---

## 📁 Project Structure

```
src/
  app/            # Next.js App Router
  components/     # UI components (ChatBubble, MessageList, Panels)
  convex/         # Schema, queries, mutations
  lib/            # Utility functions
```

The UI remains presentation-focused, while real-time logic lives inside Convex.

---

## 📦 Installation & Setup

Clone the repository:

```
git clone <your-repo-link>
cd tars-chat
```

Install dependencies:

```
npm install
```

Run development server:

```
npm run dev
```

---

## 🔑 Required Environment Variables

Create a `.env.local` file and add:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=
```

You must configure:
- A Clerk project
- A Convex project

---

## 🧪 Production Build

Production build verified using:

```
npm run build
```

✔ TypeScript validation passes  
✔ Static optimization complete  
✔ No runtime errors  

---

## 📈 Scalability Considerations

The architecture supports future enhancements such as:

- Message pagination
- Read receipts
- Rate limiting
- End-to-end encryption
- Message edit history
- Message virtualization

The current structure allows scaling without major refactoring.

---

## 🎯 Design Philosophy

This project prioritizes:

- Clean architecture  
- Real-time correctness  
- UI clarity  
- Separation of concerns  
- Production stability  

The objective was to build something that feels like a real product rather than a basic CRUD demo.

---

## 👨‍💻 Author

Harshdeep Singh  
Full Stack Developer  

---

## 📄 License

This project was built for internship evaluation purposes.