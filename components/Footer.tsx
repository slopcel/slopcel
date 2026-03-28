import { links } from "@/constants";
import Link from "next/link";

export default function Footer(){
    return(
        <footer className="py-20 px-6 border-t border-gray-800 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div>
              <div className="text-2xl font-bold text-white mb-3">Slopcel</div>
              <p className="text-gray-400 text-sm max-w-md mb-6">
                Vercel for Vibecoded Projects — Now moving to <Link href="https://cookd.fun" target="_blank" rel="noopener noreferrer" className="text-[#d4a017] hover:underline">cookd.fun</Link>
              </p>
              <div className="flex items-center gap-4">
                <Link href={links["twitter"]} className="p-2 rounded-md border border-gray-800 hover:bg-[#111]" target="_blank">
                  <img src="/icons/twitter.svg" alt=""/>
                </Link>
                <Link href={links["discord"]} className="p-2 rounded-md border border-gray-800 hover:bg-[#111]" target="_blank">
                    <img src="/icons/discord.svg" alt=""/>
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 text-sm text-gray-400">
              <Link href="/projects" className="hover:text-white">Projects</Link>
              <Link href="/hall-of-fame" className="hover:text-white">Hall of Fame</Link>
              <Link href="https://cookd.fun" target="_blank" rel="noopener noreferrer" className="hover:text-[#d4a017]">cookd.fun →</Link>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>© 2025 Slopcel. All rights reserved.</div>
            <div className="text-gray-500">Made with 🔥and hatred.</div>
          </div>
        </div>
      </footer>
    )
}