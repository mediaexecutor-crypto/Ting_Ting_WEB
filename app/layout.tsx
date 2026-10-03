import './globals.css';
import NumberInputWheelFix from '@/components/NumberInputWheelFix';

export const metadata = {
  title: 'CODS OMS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NumberInputWheelFix />
        {children}
      </body>
    </html>
  );
}
