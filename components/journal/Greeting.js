'use client';

export default function Greeting({ greeting, username }) {
    return (
        <div className="absolute bottom-6 left-6 z-20 animate-fade-in">
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                {greeting}, <span className="text-yellow-400">{username}</span>
            </h1>
        </div>
    );
}