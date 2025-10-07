// for gemini copy/components/journal/TextEditor.js
'use client';
import { useState } from 'react';

// This is a basic text editor. For a full-featured one with a floating toolbar,
// you would typically use a library like TipTap or Slate.js.
// This serves as a functional placeholder.

export default function TextEditor({ initialContent, onSave }) {
    const [content, setContent] = useState(initialContent);

    const handleBlur = () => {
        onSave(content);
    };

    return (
        <div className="h-full">
            <textarea
                value={content.replace(/<p>|<\/p>/g, '')} // Basic HTML stripping for textarea
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleBlur}
                className="w-full h-full bg-transparent text-gray-200 resize-none focus:outline-none text-base"
                placeholder="Start writing..."
            />
            {/* The floating toolbar would be implemented here in a real version */}
        </div>
    );
}