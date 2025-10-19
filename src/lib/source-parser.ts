// Utility functions for parsing embedded sources from chat responses

export interface ParsedSource {
  label: string;
  filename: string;
  document_id: string;
  date: string;
}

export function parseEmbeddedSources(answerText: string): ParsedSource[] {
  const sources: ParsedSource[] = [];
  
  // First, try to match the **Sources:** format
  const sourcesMatch = answerText.match(/\*\*Sources:\*\*\n((?:- .+\n?)+)/);
  
  if (sourcesMatch) {
    const sourceLines = sourcesMatch[1].split('\n').filter(line => line.trim().startsWith('-'));
    sourceLines.forEach(line => {
      const match = line.match(/- (\w+) = "([^"]+)" \[doc_([^\]]+)\], dated "([^"]+)"/);
      if (match) {
        sources.push({
          label: match[1],
          filename: match[2],
          document_id: match[3],
          date: match[4]
        });
      }
    });
  }
  
  // Also try to match the inline format like: = "filename" [doc_id], dated "date"
  const inlineSourcesMatch = answerText.match(/= "([^"]+)" \[doc_([^\]]+)\], dated "([^"]+)"/g);
  if (inlineSourcesMatch) {
    inlineSourcesMatch.forEach((match, index) => {
      const sourceMatch = match.match(/= "([^"]+)" \[doc_([^\]]+)\], dated "([^"]+)"/);
      if (sourceMatch) {
        sources.push({
          label: `file${sources.length + 1}`,
          filename: sourceMatch[1],
          document_id: sourceMatch[2],
          date: sourceMatch[3]
        });
      }
    });
  }
  
  return sources;
}

export function extractAnswerWithoutSources(answerText: string): string {
  let cleanAnswer = answerText;
  
  // Remove the **Sources:** section from the answer
  cleanAnswer = cleanAnswer.replace(/\*\*Sources:\*\*\n(?:- .+\n?)+/, '');
  
  // Remove inline source format like: = "filename" [doc_id], dated "date"
  cleanAnswer = cleanAnswer.replace(/= "([^"]+)" \[doc_([^\]]+)\], dated "([^"]+)"/g, '');
  
  // Remove any remaining source patterns that might be at the end
  cleanAnswer = cleanAnswer.replace(/\n\s*= "([^"]+)" \[doc_([^\]]+)\], dated "([^"]+)"\s*$/gm, '');
  
  // Remove any source references that appear as standalone text (like "file1", "file2")
  // This prevents them from being converted to hyperlinks later
  cleanAnswer = cleanAnswer.replace(/\b(file\d+)\b/g, '');
  
  // Remove any remaining source metadata patterns
  cleanAnswer = cleanAnswer.replace(/\n\s*\(source:\s*\)/g, '');
  cleanAnswer = cleanAnswer.replace(/\n\s*\(source:\s*,\s*p\.\s*\d+,\s*dated\s+\d{4}-\d{2}-\d{2}\)/g, '');
  
  // Clean up extra whitespace and newlines
  cleanAnswer = cleanAnswer.replace(/\n{3,}/g, '\n\n').trim();
  
  return cleanAnswer;
}
