# My Finance

A React Native mobile application built with Expo that helps you track your finances by automatically monitoring SMS payment notifications and managing your transactions.

## Features

- 📱 SMS Payment Tracking: Automatically detects and processes payment-related SMS messages
- 💳 Transaction Management
- 🔐 Secure Local Storage using SQLite
- 📊 Modern and Clean UI
- 🔄 Background SMS Processing
- 📱 Cross-Platform Support (Android/iOS)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-finance
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the Expo development server:
```bash
npx expo start
```

## Environment Setup

### Android
- Enable SMS permissions on your device when prompted
- Grant necessary permissions for background SMS processing

### iOS
- Note: SMS listening functionality is currently only available on Android devices

## Tech Stack

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for local database
- [Drizzle ORM](https://orm.drizzle.team/) for database management
- [react-native-android-sms-listener](https://www.npmjs.com/package/react-native-android-sms-listener) for SMS processing

## Project Structure

```
my-finance/
├── App.tsx              # Main application entry point
├── navigation/          # Navigation configuration
├── components/         # Reusable UI components
├── services/          # Business logic and services
├── storage/           # Database and storage related code
├── types/            # TypeScript type definitions
└── drizzle/          # Database migrations and schema
```

## Database Migrations

The app uses Drizzle ORM for database management. Migrations are automatically handled when the app starts.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the Expo team for the amazing framework
- All the contributors who have helped with the project

## Support

For support, please open an issue in the repository or contact the maintainers.
