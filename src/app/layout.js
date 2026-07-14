import './globals.css';
import { Web3Provider } from './providers';

export const metadata = {
  title: 'Mortgage — Interactive 3D City',
  description: 'Explore an interactive 3D city with building details, immersive navigation, and stunning visuals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
