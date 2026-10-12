import { formatDocumentFileSize, formatUploadedAt } from './exam-document-format.util';

describe('exam-document-format.util', () => {
  describe('formatDocumentFileSize', () => {
    it('returns null for missing or invalid sizes', () => {
      expect(formatDocumentFileSize(null)).toBeNull();
      expect(formatDocumentFileSize(-1)).toBeNull();
    });

    it('formats bytes, kilobytes and megabytes without inventing values', () => {
      expect(formatDocumentFileSize(0)).toBe('0 B');
      expect(formatDocumentFileSize(512)).toBe('512 B');
      expect(formatDocumentFileSize(204800)).toBe('200 KB');
      expect(formatDocumentFileSize(1048576)).toBe('1 MB');
    });
  });

  describe('formatUploadedAt', () => {
    it('renders a UTC instant in the local calendar', () => {
      const formatted = formatUploadedAt('2026-10-09T18:00:00Z');
      const local = new Date('2026-10-09T18:00:00Z');
      const pad = (part: number): string => String(part).padStart(2, '0');
      expect(formatted).toBe(
        `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())} ${pad(local.getHours())}:${pad(local.getMinutes())}`,
      );
    });

    it('returns an empty string for an invalid instant', () => {
      expect(formatUploadedAt('not-a-date')).toBe('');
    });
  });
});
