import { links } from "@/constants";
import Link from "next/link";

export default function Footer(){
    return(
        <footer className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-16">
            <div>
              <div className="text-2xl font-bold text-white mb-3">Slopcel</div>
              <p className="text-gray-400 text-sm max-w-md mb-6">
                Vercel for Vibecoded Projects
              </p>
              <div className="flex items-center gap-4">
                <Link href="#" className="p-2 rounded-md border border-gray-800 hover:bg-[#111]">
                  <img src="/icons/twitter.svg" alt=""/>
                </Link>
                <Link href="#" className="p-2 rounded-md border border-gray-800 hover:bg-[#111]">
                    <img src="/icons/discord.svg" alt=""/>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
              <div>
                <div className="text-gray-200 font-semibold mb-3">Overview</div>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#" className="hover:text-white">Projects</Link></li>
                  <li><Link href="#" className="hover:text-white">Blog</Link></li>
                  <li><Link href="#" className="hover:text-white">Changelog</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-gray-200 font-semibold mb-3">Info</div>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="#about" className="hover:text-white">About</Link></li>
                  <li><Link href={links["twitter"]} className="hover:text-white">Contact</Link></li>
                  <li><Link href="/hall-of-fame" className="hover:text-white">Hall of Fame</Link></li>
                </ul>
              </div>
              <div>
              <div className="text-gray-200 font-semibold mb-3">Legal</div>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                  <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>© 2025 Slopcel. All rights reserved.</div>
            <div className="text-gray-500">Made with 🔥 and hatred.</div>
          </div>
        </div>
      </footer>
    )
}