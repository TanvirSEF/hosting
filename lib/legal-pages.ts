import fs from 'fs/promises';
import path from 'path';

export interface LegalPageData {
  title: string;
  pageLastUpdated: string;
  introduction: string;
  breadcrumb: {
    home: string;
    legal: string;
  };
  lastUpdated: string;
  sidebar: {
    title: string;
  };
  links: {
    privacyPolicy: string;
    termsOfService: string;
    cookiePolicy: string;
  };
  contact: {
    title: string;
    description: string;
    button: string;
  };
  sections: Array<{
    title: string;
    content?: string;
    subsections?: Array<{
      title: string;
      content: string;
    }>;
  }>;
}

export async function getLegalPage(
  pageType: 'privacy-policy' | 'terms-of-service' | 'cookie-policy',
  locale: string = 'en'
): Promise<LegalPageData | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      'content/legal',
      pageType,
      `${locale}.json`
    );
    
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as LegalPageData;
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch legal page ${pageType}:`, error);
    return null;
  }
}
