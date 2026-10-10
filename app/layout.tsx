import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Abhishek Tiwari — Code with craft. Build with soul.',description:'Software engineer crafting mobile experiences with React Native, TypeScript and thoughtful design.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
