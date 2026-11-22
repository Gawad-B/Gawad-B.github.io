import { Fragment } from 'react';

function split(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function wordCount(text: string): number {
  return split(text).length;
}

/** Splits text into word spans for `.pv-rv--words` reveals. Words are joined by plain spaces, so
    assistive tech reads it as ordinary text. */
export function Words({ text, startIndex = 0 }: { text: string; startIndex?: number }) {
  return (
    <span className="pv-words">
      {split(text).map((word, i) => (
        <Fragment key={i}>
          {i > 0 ? ' ' : null}
          <span className="pv-w" style={{ ['--pv-i' as string]: startIndex + i }}>
            {word}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
