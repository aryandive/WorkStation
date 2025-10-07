'use client';

import { useState } from 'react';
import Image from 'next/image';
import insta from '../public/social/insta.svg'; // Replace with your actual SVG path

export default function Social() {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative flex justify-center items-center">
            {/* Main Button */}
            <button
                onClick={() => setOpen(!open)}
                className="w-25 h-12 relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-500 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800">
                {/* aria-label="Open social media links" */}
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-current dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
                    Click me
                </span>
            </button>
            {/* <button
                onClick={() => setOpen(!open)}
                className="w-16 h-16 rounded-full bg-blue-600 flex justify-center items-center shadow-lg transition duration-300 hover:bg-blue-700"
                aria-label="Open social media links" 
            >
                Plus Icon
                <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
                    <path d="M12 5v14m-7-7h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>*/}

            <div className='absolute left-0'>
                {/* Social Media Icons */}
                <div className={`absolute flex gap-0 transition-all duration-500 ${open ? '-translate-y-32 opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                        <div className="w-12 h-12 flex justify-center items-center shadow-md hover:scale-110 transition">
                            {/* Your Facebook SVG */}
                            <Image width={50} height={50} src="/social/insta.svg" alt="" />
                        </div>
                    </a>

                    <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                        <div className="w-12 h-12 flex justify-center items-center shadow-md hover:scale-110 transition">
                            {/* Your Twitter SVG */}
                            <Image width={50} height={50} src="/social/x.svg" alt="" />
                        </div>
                    </a>

                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <div className="w-12 h-12 flex justify-center items-center shadow-md hover:scale-110 transition">
                            {/* Your Instagram SVG */}
                            <Image width={50} height={50} src="/social/yt.svg" alt="" />
                        </div>
                    </a>

                    <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <div className="w-12 h-12 flex justify-center items-center shadow-md hover:scale-110 transition">
                            {/* Your Instagram SVG */}
                            <Image width={50} height={50} src="/social/tiktok.svg" alt="" />
                        </div>
                    </a>

                    {/* <a href="" target="_blank" rel="noopener noreferrer" aria-label="share">
                        <div className="w-12 h-12 flex justify-center items-center shadow-md hover:scale-110 transition">
                            Your share SVG 
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>

                        </div>
                    </a> */}

                    <div className="relative inline-block group">
                        {/* Share button */}
                        <button
                            aria-label="Share"
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform duration-9000"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-gray-800"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                        </button>

                        {/* Tooltip on the right side of the button */}
                        <div
                            className="
    absolute left-full top-1/2 transform -translate-y-1/2 ml-3 w-64
    bg-gray-800 text-white text-sm rounded-lg shadow-lg p-4
    opacity-0 scale-95
    group-hover:opacity-100 group-hover:scale-100
    pointer-events-none group-hover:pointer-events-auto
    transition-all duration-200 ease-out
    origin-left
    z-10
    "
                        >
                            <p className="mb-3">
                                Share it with someone if it gave you any value—and it’ll help an indie developer like me a lot 😊
                            </p>
                            <ul className="space-y-2">
                                <li>
                                    <button className="w-full text-left underline hover:text-blue-300">
                                        Copy link
                                    </button>
                                </li>
                                <li>
                                    <a
                                        href="https://twitter.com/intent/tweet?url=YOUR_URL"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-400"
                                    >
                                        Twitter
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.linkedin.com/sharing/share-offsite/?url=YOUR_URL"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-600"
                                    >
                                        LinkedIn
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.reddit.com/submit?url=YOUR_URL"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-orange-400"
                                    >
                                        Reddit
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://api.whatsapp.com/send?text=YOUR_URL"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-green-400"
                                    >
                                        WhatsApp
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://t.me/share/url?url=YOUR_URL"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-blue-500"
                                    >
                                        Telegram
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div >
    );
}