// Simple markdown renderer for chat messages
class SimpleMarkdown {
    static render(text) {
        if (!text) return '';

        // Convert text to string and escape HTML
        text = String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Handle line breaks - convert \n to <br>
        text = text.replace(/\n/g, '<br>');

        // Handle ****highlight**** text (must come before **bold**)
        text = text.replace(/\*\*\*\*(.*?)\*\*\*\*/g, '<span class="highlight">$1</span>');

        // Handle **bold** text
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Handle *italic* text
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Handle `code` text
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');

        // Handle --- horizontal rules
        text = text.replace(/^---$/gm, '<hr>');

        // Handle basic links [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Handle simple bullet points (lines starting with -)
        text = text.replace(/^- (.+)$/gm, '<li>$1</li>');

        // Wrap consecutive <li> elements in <ul>
        text = text.replace(/(<li>.*<\/li>)/gs, (match) => {
            return '<ul>' + match + '</ul>';
        });

        return text;
    }

    // Convert markdown to plain text for tooltips/summaries
    static toPlainText(text) {
        if (!text) return '';

        return String(text)
            .replace(/\*\*\*\*(.*?)\*\*\*\*/g, '$1')  // Remove highlight
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
            .replace(/\*(.*?)\*/g, '$1')      // Remove italic
            .replace(/`(.*?)`/g, '$1')        // Remove code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links, keep text
            .replace(/\n/g, ' ')              // Replace newlines with spaces
            .replace(/\s+/g, ' ')             // Normalize spaces
            .trim();
    }

    // Check if text contains markdown
    static hasMarkdown(text) {
        if (!text) return false;

        const markdownPatterns = [
            /\*\*\*\*.*?\*\*\*\*/,  // Highlight
            /\*\*.*?\*\*/,          // Bold
            /\*.*?\*/,              // Italic
            /`.*?`/,                // Code
            /\[.*?\]\(.*?\)/,       // Links
            /^- /m,                 // Bullet points
            /\n/                    // Line breaks
        ];

        return markdownPatterns.some(pattern => pattern.test(text));
    }
}

// Make it available globally
window.SimpleMarkdown = SimpleMarkdown;