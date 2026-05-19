import { defineConfig } from 'tinacms';

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main';

export default defineConfig({
  branch,

  // Get this from tina.io (optional for local dev)
  // Get this from tina.io (optional for local dev)
  clientId: (() => {
    const id = process.env.NEXT_PUBLIC_TINA_CLIENT_ID || '51170d34-d312-428e-96d7-7f35f42e939f';
    if (!id) console.warn('WARNING: NEXT_PUBLIC_TINA_CLIENT_ID is missing');
    else console.log('NEXT_PUBLIC_TINA_CLIENT_ID is present');
    return id || null;
  })(),
  // Get this from tina.io (optional for local dev)
  token: (() => {
    const t = process.env.TINA_TOKEN || '96c5eb36f7b3c467fd502f9a67c79e858ceebca3';
    if (!t) console.warn('WARNING: TINA_TOKEN is missing');
    else console.log('TINA_TOKEN is present');
    return t || null;
  })(),

  build: {
    outputFolder: 'tina-admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: '',
      publicFolder: 'public',
    },
  },
  // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
  schema: {
    collections: [
      {
        name: 'homepage',
        label: 'Homepage Content',
        path: 'translations/home',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'metadata',
            label: 'Page Metadata',
            fields: [
              { type: 'string', name: 'title', label: 'Page Title' },
              { type: 'string', name: 'description', label: 'Meta Description' },
            ],
          },
          {
            type: 'object',
            name: 'navbar',
            label: 'Navigation Bar',
            fields: [
              { type: 'string', name: 'pricing', label: 'Pricing Link' },
              { type: 'string', name: 'aboutUs', label: 'About Us Link' },
              {
                type: 'object',
                name: 'services',
                label: 'Services Menu',
                fields: [
                  { type: 'string', name: 'title', label: 'Services Title' },
                  { type: 'string', name: 'hosting', label: 'Hosting' },
                  { type: 'string', name: 'domains', label: 'Domains' },
                  {
                    type: 'object',
                    name: 'sharedHosting',
                    label: 'Shared Hosting',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'vps',
                    label: 'VPS Hosting',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'wordpress',
                    label: 'WordPress Hosting',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'ecommerce',
                    label: 'E-commerce Hosting',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'domainSearch',
                    label: 'Domain Search',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'domainTransfer',
                    label: 'Domain Transfer',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                ],
              },
              {
                type: 'object',
                name: 'support',
                label: 'Support Menu',
                fields: [
                  { type: 'string', name: 'title', label: 'Support Title' },
                  {
                    type: 'object',
                    name: 'ticket',
                    label: 'Support Ticket',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'contact',
                    label: 'Contact Us',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'liveChat',
                    label: 'Live Chat',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                ],
              },
              {
                type: 'object',
                name: 'resources',
                label: 'Resources Menu',
                fields: [
                  { type: 'string', name: 'title', label: 'Resources Title' },
                  {
                    type: 'object',
                    name: 'documentation',
                    label: 'Documentation',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'blog',
                    label: 'Blog',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'guides',
                    label: 'Guides',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'api',
                    label: 'API Reference',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description' },
                    ],
                  },
                ],
              },
              {
                type: 'object',
                name: 'auth',
                label: 'Auth Buttons',
                fields: [
                  { type: 'string', name: 'signIn', label: 'Sign In' },
                  { type: 'string', name: 'getStarted', label: 'Get Started' },
                ],
              },
              {
                type: 'object',
                name: 'userMenu',
                label: 'User Menu',
                fields: [
                  { type: 'string', name: 'dashboard', label: 'Dashboard' },
                  { type: 'string', name: 'adminDashboard', label: 'Admin Panel' },
                  { type: 'string', name: 'settings', label: 'Settings' },
                  { type: 'string', name: 'logout', label: 'Log out' },
                ],
              },
              {
                type: 'object',
                name: 'mobile',
                label: 'Mobile Menu',
                fields: [
                  { type: 'string', name: 'menu', label: 'Menu Text' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'footer',
            label: 'Footer',
            fields: [
              { type: 'string', name: 'copyright', label: 'Copyright Text' },
              {
                type: 'object',
                name: 'hosting',
                label: 'Hosting Links',
                fields: [
                  { type: 'string', name: 'title', label: 'Section Title' },
                  { type: 'string', name: 'sharedHosting', label: 'Shared Hosting' },
                  { type: 'string', name: 'wordpressHosting', label: 'WordPress Hosting' },
                  { type: 'string', name: 'vpsHosting', label: 'VPS Hosting' },
                  { type: 'string', name: 'ecommerceHosting', label: 'E-commerce Hosting' },
                  { type: 'string', name: 'pricing', label: 'Pricing' },
                ],
              },
              {
                type: 'object',
                name: 'domains',
                label: 'Domains Links',
                fields: [
                  { type: 'string', name: 'title', label: 'Section Title' },
                  { type: 'string', name: 'domainSearch', label: 'Domain Search' },
                  { type: 'string', name: 'domainTransfer', label: 'Domain Transfer' },
                ],
              },
              {
                type: 'object',
                name: 'support',
                label: 'Company Links',
                fields: [
                  { type: 'string', name: 'title', label: 'Section Title' },
                  { type: 'string', name: 'about', label: 'About' },
                  { type: 'string', name: 'contact', label: 'Contact' },
                  { type: 'string', name: 'blog', label: 'Blog' },
                  { type: 'string', name: 'guides', label: 'Guides' },
                ],
              },
              {
                type: 'object',
                name: 'policy',
                label: 'Policy Links',
                fields: [
                  { type: 'string', name: 'privacy', label: 'Privacy Policy' },
                  { type: 'string', name: 'terms', label: 'Terms of Service' },
                  { type: 'string', name: 'cookie', label: 'Cookie Policy' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'brandName', label: 'Brand Name' },
              { type: 'string', name: 'mainTitle', label: 'Main Title', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'pricing',
                label: 'Pricing',
                fields: [
                  { type: 'string', name: 'from', label: 'From' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'offer', label: 'Offer' },
                ],
              },
              {
                type: 'object',
                name: 'features',
                label: 'Features',
                fields: [
                  { type: 'string', name: 'domain', label: 'Domain Feature' },
                  { type: 'string', name: 'hosting', label: 'Hosting Feature' },
                  { type: 'string', name: 'support', label: 'Support Feature' },
                ],
              },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
              { type: 'string', name: 'guarantee', label: 'Guarantee Text' },
            ],
          },
          {
            type: 'object',
            name: 'stats',
            label: 'Stats Section',
            fields: [
              {
                type: 'object',
                name: 'clients',
                label: 'Clients Stat',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'countries',
                label: 'Countries Stat',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'experience',
                label: 'Experience Stat',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'websites',
                label: 'Websites Stat',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'domainSearch',
            label: 'Domain Search Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'pricing',
            label: 'Pricing Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'mostPopular', label: 'Most Popular Badge' },
              { type: 'string', name: 'cta', label: 'CTA Button' },
              { type: 'string', name: 'firstYear', label: 'First Year Label' },
              { type: 'string', name: 'standardRate', label: 'Standard Rate Label' },
              { type: 'string', name: 'billedAnnually', label: 'Billed Annually Label' },
              { type: 'string', name: 'from', label: 'From Label' },
              { type: 'string', name: 'youSave', label: 'You Save Label' },
            ],
          },
          {
            type: 'object',
            name: 'services',
            label: 'Services Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'string',
                name: 'categories',
                label: 'Categories',
                list: true,
              },
              {
                type: 'object',
                name: 'cards',
                label: 'Service Cards',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item.title }),
                },
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  {
                    type: 'string',
                    name: 'features',
                    label: 'Features',
                    list: true,
                  },
                  { type: 'string', name: 'buttonLink', label: 'Button Link (e.g., /shared-hosting or /pricing)', description: 'The URL where the button should navigate to' },
                  { type: 'string', name: 'buttonText', label: 'Button Text (optional)', description: 'Custom button text. Leave empty to use default CTA text.' },
                ],
              },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
            ],
          },
          {
            type: 'object',
            name: 'speed',
            label: 'Speed Comparison Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'legend', label: 'Chart Legend' },
              {
                type: 'object',
                name: 'competitors',
                label: 'Competitors',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item.name }),
                },
                fields: [
                  { type: 'string', name: 'name', label: 'Competitor Name' },
                  { type: 'number', name: 'time', label: 'Load Time (seconds)' },
                  { type: 'boolean', name: 'highlight', label: 'Highlight (WebblyHosting)' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'blog',
            label: 'Blog Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
            ],
          },
          {
            type: 'object',
            name: 'features',
            label: 'Features Tabs Section',
            fields: [
              {
                type: 'object',
                name: 'performance',
                label: 'Performance Section',
                fields: [
                  { type: 'string', name: 'tagline', label: 'Tagline' },
                  { type: 'string', name: 'heading', label: 'Heading' },
                  { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
                  {
                    type: 'object',
                    name: 'tabs',
                    label: 'Performance Tabs',
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item.title }),
                    },
                    fields: [
                      { type: 'number', name: 'id', label: 'ID' },
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                      { type: 'string', name: 'image', label: 'Image Path' },
                    ],
                  },
                ],
              },
              {
                type: 'object',
                name: 'development',
                label: 'Development Section',
                fields: [
                  { type: 'string', name: 'tagline', label: 'Tagline' },
                  { type: 'string', name: 'heading', label: 'Heading' },
                  { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
                  {
                    type: 'object',
                    name: 'tabs',
                    label: 'Development Tabs',
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item.title }),
                    },
                    fields: [
                      { type: 'number', name: 'id', label: 'ID' },
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                      { type: 'string', name: 'image', label: 'Image Path' },
                    ],
                  },
                ],
              },
              {
                type: 'object',
                name: 'security',
                label: 'Security Section',
                fields: [
                  { type: 'string', name: 'tagline', label: 'Tagline' },
                  { type: 'string', name: 'heading', label: 'Heading' },
                  { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
                  {
                    type: 'object',
                    name: 'tabs',
                    label: 'Security Tabs',
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item.title }),
                    },
                    fields: [
                      { type: 'number', name: 'id', label: 'ID' },
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                      { type: 'string', name: 'image', label: 'Image Path' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'comparison',
            label: 'Comparison Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'tableHeader', label: 'Table Header' },
              {
                type: 'object',
                name: 'competitors',
                label: 'Competitors',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item.name }),
                },
                fields: [
                  { type: 'string', name: 'name', label: 'Competitor Name' },
                  { type: 'string', name: 'price', label: 'Price' },
                ],
              },
              {
                type: 'object',
                name: 'features',
                label: 'Features',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item.name }),
                },
                fields: [
                  { type: 'string', name: 'name', label: 'Feature Name' },
                  {
                    type: 'string',
                    name: 'webbly',
                    label: 'WebblyHosting Value',
                    description: 'Enter "true" (shows checkmark), "false" (shows X), or any text value'
                  },
                  {
                    type: 'string',
                    name: 'hostinger',
                    label: 'Hostinger Value',
                    description: 'Enter "true" (shows checkmark), "false" (shows X), or any text value'
                  },
                ],
              },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'questions',
                label: 'FAQ Questions',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item.question }),
                },
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'CTA Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email Address' },
              { type: 'string', name: 'phone', label: 'Phone Number' },
              {
                type: 'object',
                name: 'info',
                label: 'Contact Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social Media',
                    fields: [
                      { type: 'string', name: 'title', label: 'Social Title' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'discordTicketSuccess',
            label: 'Discord Ticket Success',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'connectTitle', label: 'Connect Card Title' },
              { type: 'string', name: 'connectDescription', label: 'Connect Card Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'connectButtonText', label: 'Connect Button Text' },
              { type: 'string', name: 'connectFooter', label: 'Connect Footer Instructions', ui: { component: 'textarea' } },
              { type: 'string', name: 'sendAnother', label: 'Send Another Button Text' },
            ],
          },
        ],
      },
      {
        name: 'pricePhilosophy',
        label: 'Price Philosophy Page',
        path: 'translations/price-philosophy',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'metadata',
            label: 'Page Metadata',
            fields: [
              { type: 'string', name: 'title', label: 'Page Title' },
              { type: 'string', name: 'description', label: 'Meta Description' },
            ],
          },
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'brandName', label: 'Brand Name' },
              { type: 'string', name: 'mainTitle', label: 'Main Title', ui: { component: 'textarea' } },
              { type: 'string', name: 'paragraph1', label: 'Paragraph 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'paragraph2', label: 'Paragraph 2', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'features',
                label: 'Features List',
                fields: [
                  { type: 'string', name: 'feature1', label: 'Feature 1' },
                  { type: 'string', name: 'feature2', label: 'Feature 2' },
                  { type: 'string', name: 'feature3', label: 'Feature 3' },
                ],
              },
              { type: 'string', name: 'conclusion', label: 'Conclusion Paragraph', ui: { component: 'textarea' } },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
              { type: 'string', name: 'guarantee', label: 'Guarantee Text' },
            ],
          },
          {
            type: 'object',
            name: 'problem',
            label: 'The Problem With Others Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading (Black Text)' },
              { type: 'string', name: 'headingGradient', label: 'Heading (Purple Text)' },
              { type: 'string', name: 'paragraph1', label: 'Paragraph 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'paragraph2', label: 'Paragraph 2', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'card',
                label: 'Floating Card',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'stats',
            label: 'Stats Section',
            fields: [
              {
                type: 'object',
                name: 'clients',
                label: 'Clients Stat',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'countries',
                label: 'Countries Stat',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'experience',
                label: 'Experience Stat',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'websites',
                label: 'Websites Stat',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'about',
        label: 'About Page',
        path: 'translations/about',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
            ],
          },
          {
            type: 'object',
            name: 'sections',
            label: 'Content Sections',
            fields: [
              {
                type: 'object',
                name: 'items',
                label: 'Section Items',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item.heading }),
                },
                fields: [
                  { type: 'string', name: 'heading', label: 'Heading' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                  { type: 'image', name: 'image', label: 'Image' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'testimonials',
            label: 'Testimonials Section',
            fields: [
              { type: 'string', name: 'subtitle', label: 'Subtitle (optional)' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'items',
                label: 'Testimonials',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item.name || 'New Testimonial' }),
                },
                fields: [
                  { type: 'string', name: 'quote', label: 'Quote', ui: { component: 'textarea' } },
                  { type: 'string', name: 'name', label: 'Name' },
                  { type: 'string', name: 'position', label: 'Position' },
                  { type: 'string', name: 'company', label: 'Company' },
                  { type: 'number', name: 'rating', label: 'Rating (1-5)' },
                  { type: 'image', name: 'image', label: 'Profile Image' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'Ready to Scale Up Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'email', label: 'Email' },
              { type: 'string', name: 'phone', label: 'Phone' },
            ],
          },
        ],
      },
      {
        name: 'contact',
        label: 'Contact Page',
        path: 'translations/contact',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
            ],
          },
          {
            type: 'object',
            name: 'info',
            label: 'Contact Information',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'email',
                label: 'Email',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'value', label: 'Email Address' },
                  { type: 'string', name: 'description', label: 'Description' },
                ],
              },
              {
                type: 'object',
                name: 'phone',
                label: 'Phone',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'value', label: 'Phone Number' },
                  { type: 'string', name: 'description', label: 'Description' },
                ],
              },
              {
                type: 'object',
                name: 'address',
                label: 'Address',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'value', label: 'Address' },
                  { type: 'string', name: 'description', label: 'Description' },
                ],
              },
              {
                type: 'object',
                name: 'hours',
                label: 'Business Hours',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'value', label: 'Hours' },
                  { type: 'string', name: 'description', label: 'Description' },
                ],
              },
              {
                type: 'object',
                name: 'social',
                label: 'Social Sharing',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'form',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'firstName', label: 'First Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastName', label: 'Last Name Label' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'email', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'phone', label: 'Phone Label' },
              { type: 'string', name: 'phonePlaceholder', label: 'Phone Placeholder' },
              { type: 'string', name: 'subject', label: 'Subject Label' },
              { type: 'string', name: 'subjectPlaceholder', label: 'Subject Placeholder' },
              {
                type: 'string',
                name: 'subjects',
                label: 'Subject Options',
                list: true,
              },
              { type: 'string', name: 'message', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submit', label: 'Submit Button Text' },
              { type: 'string', name: 'sending', label: 'Sending Button Text' },
              { type: 'string', name: 'successTitle', label: 'Success Title' },
              { type: 'string', name: 'successMessage', label: 'Success Message', ui: { component: 'textarea' } },
            ],
          },
          {
            type: 'object',
            name: 'map',
            label: 'Our Location',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'embedUrl', label: 'Google Maps Embed URL', description: 'The full iframe src URL for the Google Maps embed' },
            ],
          },
          {
            type: 'object',
            name: 'support',
            label: 'Ways to Get Help',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'email',
                label: 'Email Support Option',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                  { type: 'string', name: 'action', label: 'Action Button Text' },
                  { type: 'string', name: 'link', label: 'Link (e.g., mailto:support@example.com or /contact)', description: 'The URL or mailto link for this option' },
                ],
              },
              {
                type: 'object',
                name: 'knowledge',
                label: 'Knowledge Base Option',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                  { type: 'string', name: 'action', label: 'Action Button Text' },
                  { type: 'string', name: 'link', label: 'Link (e.g., /blog/category/guides)', description: 'The URL for this option' },
                ],
              },
              {
                type: 'object',
                name: 'ticket',
                label: 'Support Ticket Option',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                  { type: 'string', name: 'action', label: 'Action Button Text' },
                  { type: 'string', name: 'link', label: 'Link (e.g., /dashboard/support)', description: 'The URL for this option' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'hosting',
        label: 'Shared Hosting Page',
        path: 'translations/shared-hosting',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'brandName', label: 'Brand Name' },
              { type: 'string', name: 'mainTitle', label: 'Main Title', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'pricing',
                label: 'Pricing',
                fields: [
                  { type: 'string', name: 'from', label: 'From' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'offer', label: 'Offer Text' },
                ],
              },
              {
                type: 'object',
                name: 'features',
                label: 'Hero Features',
                fields: [
                  { type: 'string', name: 'domain', label: 'Feature 1' },
                  { type: 'string', name: 'hosting', label: 'Feature 2' },
                  { type: 'string', name: 'support', label: 'Feature 3' },
                  { type: 'string', name: 'reliability', label: 'Feature 4' },
                ],
              },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
              { type: 'string', name: 'guarantee', label: 'Guarantee Text' },
            ],
          },
          {
            type: 'object',
            name: 'stats',
            label: 'Stats Section',
            fields: [
              {
                type: 'object',
                name: 'clients',
                label: 'Clients',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'countries',
                label: 'Countries',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'experience',
                label: 'Experience',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'websites',
                label: 'Websites',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'pricing',
            label: 'Pricing Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'mostPopular', label: 'Most Popular Label' },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'firstYear', label: 'First Year Label' },
              { type: 'string', name: 'standardRate', label: 'Standard Rate Label' },
              { type: 'string', name: 'billedAnnually', label: 'Billed Annually Label' },
              { type: 'string', name: 'from', label: 'From Label' },
              { type: 'string', name: 'youSave', label: 'You Save Label' },
              { type: 'string', name: 'orderLinkBase', label: 'Order Link Base', description: 'Use {plan} as placeholder for the plan ID or end with ?plan=' },
              {
                type: 'object',
                name: 'plans',
                label: 'Plans',
                list: true,
                fields: [
                  { type: 'string', name: 'name', label: 'Name' },
                  { type: 'string', name: 'description', label: 'Description' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'yearly', label: 'Yearly Price' },
                  { type: 'string', name: 'orLabel', label: 'Or Label' },
                  { type: 'boolean', name: 'highlight', label: 'Highlight' },
                  {
                    type: 'string',
                    name: 'features',
                    label: 'Features',
                    list: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'features',
            label: 'Features Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'tabs',
                label: 'Tabs',
                fields: [
                  { type: 'string', name: 'performance', label: 'Performance' },
                  { type: 'string', name: 'ease', label: 'Ease' },
                  { type: 'string', name: 'security', label: 'Security' },
                ],
              },
              {
                type: 'object',
                name: 'content',
                label: 'Tab Content',
                fields: [
                  {
                    type: 'object',
                    name: 'performance',
                    label: 'Performance Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'ease',
                    label: 'Ease Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'security',
                    label: 'Security Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'creationSteps',
            label: 'Creation Steps',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'steps',
                label: 'Steps',
                list: true,
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'management',
            label: 'Management Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                fields: [
                  {
                    type: 'object',
                    name: 'monitoring',
                    label: 'Monitoring Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'patch',
                    label: 'Patch Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'backups',
                    label: 'Backups Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'whyChoose',
            label: 'Why Choose Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              {
                type: 'object',
                name: 'tabs',
                label: 'Tabs',
                fields: [
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'privacy',
                    label: 'Privacy Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'pricing',
                    label: 'Pricing Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'useCases',
            label: 'Use Cases Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                list: true,
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'questions',
                label: 'Questions',
                list: true,
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'CTA Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email Address' },
              { type: 'string', name: 'phone', label: 'Phone Number' },
              {
                type: 'object',
                name: 'info',
                label: 'Contact Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contactForm',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'nameLabel', label: 'Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'messageLabel', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submitButton', label: 'Submit Button Text' },
              { type: 'string', name: 'sending', label: 'Sending Button Text' },
            ],
          },
        ],
      },
      {
        name: 'vpsHosting',
        label: 'VPS Hosting Page',
        path: 'translations/vps',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'brandName', label: 'Brand Name' },
              { type: 'string', name: 'mainTitle', label: 'Main Title', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'pricing',
                label: 'Pricing',
                fields: [
                  { type: 'string', name: 'from', label: 'From' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'offer', label: 'Offer Text' },
                ],
              },
              {
                type: 'object',
                name: 'features',
                label: 'Hero Features',
                fields: [
                  { type: 'string', name: 'domain', label: 'Feature 1' },
                  { type: 'string', name: 'hosting', label: 'Feature 2' },
                  { type: 'string', name: 'support', label: 'Feature 3' },
                ],
              },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
              { type: 'string', name: 'guarantee', label: 'Guarantee Text' },
            ],
          },
          {
            type: 'object',
            name: 'stats',
            label: 'Stats Section',
            fields: [
              {
                type: 'object',
                name: 'clients',
                label: 'Clients',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'countries',
                label: 'Countries',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'experience',
                label: 'Experience',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'websites',
                label: 'Websites',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'pricing',
            label: 'Pricing Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'mostPopular', label: 'Most Popular Label' },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'firstYear', label: 'First Year Label' },
              { type: 'string', name: 'standardRate', label: 'Standard Rate Label' },
              { type: 'string', name: 'billedAnnually', label: 'Billed Annually Label' },
              { type: 'string', name: 'from', label: 'From Label' },
              { type: 'string', name: 'youSave', label: 'You Save Label' },
              { type: 'string', name: 'orderLinkBase', label: 'Order Link Base', description: 'Use {plan} as placeholder for the plan ID or end with ?plan=' },
              {
                type: 'object',
                name: 'plans',
                label: 'Plans',
                list: true,
                fields: [
                  { type: 'string', name: 'name', label: 'Name' },
                  { type: 'string', name: 'description', label: 'Description' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'yearly', label: 'Yearly Price' },
                  { type: 'string', name: 'orLabel', label: 'Or Label' },
                  { type: 'boolean', name: 'highlight', label: 'Highlight' },
                  {
                    type: 'string',
                    name: 'features',
                    label: 'Features',
                    list: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'features',
            label: 'Features Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'tabs',
                label: 'Tabs',
                fields: [
                  { type: 'string', name: 'performance', label: 'Performance' },
                  { type: 'string', name: 'control', label: 'Control' },
                  { type: 'string', name: 'security', label: 'Security' },
                ],
              },
              {
                type: 'object',
                name: 'content',
                label: 'Tab Content',
                fields: [
                  {
                    type: 'object',
                    name: 'performance',
                    label: 'Performance Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'control',
                    label: 'Control Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'security',
                    label: 'Security Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'creationSteps',
            label: 'Creation Steps',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'steps',
                label: 'Steps',
                list: true,
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'management',
            label: 'Management Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                fields: [
                  {
                    type: 'object',
                    name: 'monitoring',
                    label: 'Monitoring Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'patch',
                    label: 'Patch Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'backups',
                    label: 'Backups Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'whyChoose',
            label: 'Why Choose Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              {
                type: 'object',
                name: 'tabs',
                label: 'Tabs',
                fields: [
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'privacy',
                    label: 'Privacy Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'pricing',
                    label: 'Pricing Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'useCases',
            label: 'Use Cases Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                list: true,
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'questions',
                label: 'Questions',
                list: true,
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'CTA Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email Address' },
              { type: 'string', name: 'phone', label: 'Phone Number' },
              {
                type: 'object',
                name: 'info',
                label: 'Contact Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contactForm',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'nameLabel', label: 'Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'messageLabel', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submitButton', label: 'Submit Button Text' },
              { type: 'string', name: 'sending', label: 'Sending Button Text' },
            ],
          },
        ],
      },
      {
        name: 'wordpressHosting',
        label: 'WordPress Hosting Page',
        path: 'translations/wordpress-hosting',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'brandName', label: 'Brand Name' },
              { type: 'string', name: 'mainTitle', label: 'Main Title', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'pricing',
                label: 'Pricing',
                fields: [
                  { type: 'string', name: 'from', label: 'From' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'offer', label: 'Offer Text' },
                ],
              },
              {
                type: 'object',
                name: 'features',
                label: 'Hero Features',
                fields: [
                  { type: 'string', name: 'domain', label: 'Feature 1' },
                  { type: 'string', name: 'hosting', label: 'Feature 2' },
                  { type: 'string', name: 'support', label: 'Feature 3' },
                  { type: 'string', name: 'reliability', label: 'Feature 4' },
                ],
              },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
              { type: 'string', name: 'guarantee', label: 'Guarantee Text' },
            ],
          },
          {
            type: 'object',
            name: 'stats',
            label: 'Stats Section',
            fields: [
              {
                type: 'object',
                name: 'clients',
                label: 'Clients',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'countries',
                label: 'Countries',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'experience',
                label: 'Experience',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'websites',
                label: 'Websites',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'pricing',
            label: 'Pricing Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'mostPopular', label: 'Most Popular Label' },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'firstYear', label: 'First Year Label' },
              { type: 'string', name: 'standardRate', label: 'Standard Rate Label' },
              { type: 'string', name: 'billedAnnually', label: 'Billed Annually Label' },
              { type: 'string', name: 'from', label: 'From Label' },
              { type: 'string', name: 'youSave', label: 'You Save Label' },
              { type: 'string', name: 'orderLinkBase', label: 'Order Link Base', description: 'Use {plan} as placeholder for the plan ID or end with ?plan=' },
              {
                type: 'object',
                name: 'plans',
                label: 'Plans',
                list: true,
                fields: [
                  { type: 'string', name: 'name', label: 'Name' },
                  { type: 'string', name: 'description', label: 'Description' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'yearly', label: 'Yearly Price' },
                  { type: 'string', name: 'orLabel', label: 'Or Label' },
                  { type: 'boolean', name: 'highlight', label: 'Highlight' },
                  {
                    type: 'string',
                    name: 'features',
                    label: 'Features',
                    list: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'features',
            label: 'Features Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'tabs',
                label: 'Tabs',
                fields: [
                  { type: 'string', name: 'performance', label: 'Performance' },
                  { type: 'string', name: 'ease', label: 'Ease' },
                  { type: 'string', name: 'security', label: 'Security' },
                ],
              },
              {
                type: 'object',
                name: 'content',
                label: 'Tab Content',
                fields: [
                  {
                    type: 'object',
                    name: 'performance',
                    label: 'Performance Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'ease',
                    label: 'Ease Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'security',
                    label: 'Security Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'creationSteps',
            label: 'Creation Steps',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'steps',
                label: 'Steps',
                list: true,
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'management',
            label: 'Management Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                fields: [
                  {
                    type: 'object',
                    name: 'monitoring',
                    label: 'Monitoring Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'patch',
                    label: 'Patch Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'backups',
                    label: 'Backups Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'whyChoose',
            label: 'Why Choose Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              {
                type: 'object',
                name: 'tabs',
                label: 'Tabs',
                fields: [
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'privacy',
                    label: 'Privacy Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'pricing',
                    label: 'Pricing Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'useCases',
            label: 'Use Cases Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                list: true,
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'questions',
                label: 'Questions',
                list: true,
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'CTA Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email Address' },
              { type: 'string', name: 'phone', label: 'Phone Number' },
              {
                type: 'object',
                name: 'info',
                label: 'Contact Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contactForm',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'nameLabel', label: 'Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'messageLabel', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submitButton', label: 'Submit Button Text' },
              { type: 'string', name: 'sending', label: 'Sending Button Text' },
            ],
          },
        ],
      },
      {
        name: 'ecommerceHosting',
        label: 'E-commerce Hosting Page',
        path: 'translations/ecommerce-hosting',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'brandName', label: 'Brand Name' },
              { type: 'string', name: 'mainTitle', label: 'Main Title', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'pricing',
                label: 'Pricing',
                fields: [
                  { type: 'string', name: 'from', label: 'From' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'offer', label: 'Offer Text' },
                ],
              },
              {
                type: 'object',
                name: 'features',
                label: 'Hero Features',
                fields: [
                  { type: 'string', name: 'domain', label: 'Feature 1' },
                  { type: 'string', name: 'hosting', label: 'Feature 2' },
                  { type: 'string', name: 'support', label: 'Feature 3' },
                  { type: 'string', name: 'reliability', label: 'Feature 4' },
                ],
              },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
              { type: 'string', name: 'guarantee', label: 'Guarantee Text' },
            ],
          },
          {
            type: 'object',
            name: 'stats',
            label: 'Stats Section',
            fields: [
              {
                type: 'object',
                name: 'clients',
                label: 'Clients',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'countries',
                label: 'Countries',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'experience',
                label: 'Experience',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'websites',
                label: 'Websites',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'pricing',
            label: 'Pricing Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'mostPopular', label: 'Most Popular Label' },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'firstYear', label: 'First Year Label' },
              { type: 'string', name: 'standardRate', label: 'Standard Rate Label' },
              { type: 'string', name: 'billedAnnually', label: 'Billed Annually Label' },
              { type: 'string', name: 'from', label: 'From Label' },
              { type: 'string', name: 'youSave', label: 'You Save Label' },
              { type: 'string', name: 'orderLinkBase', label: 'Order Link Base', description: 'Use {plan} as placeholder for the plan ID or end with ?plan=' },
              {
                type: 'object',
                name: 'plans',
                label: 'Plans',
                list: true,
                fields: [
                  { type: 'string', name: 'name', label: 'Name' },
                  { type: 'string', name: 'description', label: 'Description' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'yearly', label: 'Yearly Price' },
                  { type: 'string', name: 'orLabel', label: 'Or Label' },
                  { type: 'boolean', name: 'highlight', label: 'Highlight' },
                  {
                    type: 'string',
                    name: 'features',
                    label: 'Features',
                    list: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'features',
            label: 'Features Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'tabs',
                label: 'Tabs',
                fields: [
                  { type: 'string', name: 'performance', label: 'Performance' },
                  { type: 'string', name: 'ease', label: 'Ease' },
                  { type: 'string', name: 'security', label: 'Security' },
                ],
              },
              {
                type: 'object',
                name: 'content',
                label: 'Tab Content',
                fields: [
                  {
                    type: 'object',
                    name: 'performance',
                    label: 'Performance Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'ease',
                    label: 'Ease Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'security',
                    label: 'Security Items',
                    list: true,
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'creationSteps',
            label: 'Creation Steps',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'steps',
                label: 'Steps',
                list: true,
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'management',
            label: 'Management Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                fields: [
                  {
                    type: 'object',
                    name: 'monitoring',
                    label: 'Monitoring Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'patch',
                    label: 'Patch Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'backups',
                    label: 'Backups Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Card',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'whyChoose',
            label: 'Why Choose Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              {
                type: 'object',
                name: 'tabs',
                label: 'Tabs',
                fields: [
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'privacy',
                    label: 'Privacy Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'pricing',
                    label: 'Pricing Tab',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'useCases',
            label: 'Use Cases Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                list: true,
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'questions',
                label: 'Questions',
                list: true,
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'CTA Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email Address' },
              { type: 'string', name: 'phone', label: 'Phone Number' },
              {
                type: 'object',
                name: 'info',
                label: 'Contact Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contactForm',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'nameLabel', label: 'Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'messageLabel', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submitButton', label: 'Submit Button Text' },
              { type: 'string', name: 'sending', label: 'Sending Button Text' },
            ],
          },
        ],
      },
      {
        name: 'domainSearch',
        label: 'Domain Search Page',
        path: 'translations/domain-search',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'searchPlaceholder', label: 'Search Placeholder' },
              { type: 'string', name: 'searchButton', label: 'Search Button Text' },
              { type: 'string', name: 'searching', label: 'Searching Text' },
              { type: 'string', name: 'errorEmpty', label: 'Empty Error Text' },
              { type: 'string', name: 'errorFailed', label: 'Failed Error Text' },
              { type: 'string', name: 'resultsHeading', label: 'Results Heading', description: 'Use {query} placeholder' },
              { type: 'string', name: 'availableLabel', label: 'Available Label' },
              { type: 'string', name: 'registeredLabel', label: 'Registered Label' },
              { type: 'string', name: 'priceSuffix', label: 'Price Suffix' },
              { type: 'string', name: 'statusAvailable', label: 'Available Status' },
              { type: 'string', name: 'statusTaken', label: 'Taken Status' },
              { type: 'string', name: 'registerNow', label: 'Register Button Text' },
              { type: 'string', name: 'searchAgain', label: 'Search Again Text' },
              { type: 'string', name: 'noResults', label: 'No Results Text' },
              {
                type: 'string',
                name: 'suggestions',
                label: 'Domain Suggestions',
                list: true,
              },
              {
                type: 'object',
                name: 'tlds',
                label: 'TLD Cards',
                list: true,
                fields: [
                  { type: 'string', name: 'tld', label: 'TLD' },
                  { type: 'string', name: 'oldPrice', label: 'Old Price' },
                  { type: 'string', name: 'newPrice', label: 'New Price' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'stats',
            label: 'Stats Section',
            fields: [
              {
                type: 'object',
                name: 'clients',
                label: 'Clients',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'countries',
                label: 'Countries',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'experience',
                label: 'Experience',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
              {
                type: 'object',
                name: 'websites',
                label: 'Websites',
                fields: [
                  { type: 'string', name: 'number', label: 'Number' },
                  { type: 'string', name: 'suffix', label: 'Suffix' },
                  { type: 'string', name: 'label', label: 'Label' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'pricing',
            label: 'Pricing Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'mostPopular', label: 'Most Popular Label' },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
              {
                type: 'object',
                name: 'plans',
                label: 'Plans',
                list: true,
                fields: [
                  { type: 'string', name: 'name', label: 'Name' },
                  { type: 'string', name: 'description', label: 'Description' },
                  { type: 'string', name: 'price', label: 'Price' },
                  { type: 'string', name: 'unit', label: 'Unit' },
                  { type: 'string', name: 'yearly', label: 'Yearly Price' },
                  { type: 'string', name: 'orLabel', label: 'Or Label' },
                  { type: 'boolean', name: 'highlight', label: 'Highlight' },
                  {
                    type: 'string',
                    name: 'features',
                    label: 'Features',
                    list: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'whyChoose',
            label: 'Why Choose Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                list: true,
                fields: [
                  { type: 'string', name: 'heading', label: 'Heading' },
                  { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'useCases',
            label: 'Use Cases Section',
            fields: [
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'cards',
                label: 'Cards',
                list: true,
                fields: [
                  { type: 'string', name: 'tagline', label: 'Tagline' },
                  { type: 'string', name: 'heading', label: 'Heading' },
                  { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
                  { type: 'image', name: 'image', label: 'Image' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'questions',
                label: 'Questions',
                list: true,
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'CTA Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email Address' },
              { type: 'string', name: 'phone', label: 'Phone Number' },
              {
                type: 'object',
                name: 'info',
                label: 'Contact Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contactForm',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'nameLabel', label: 'Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'messageLabel', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submitButton', label: 'Submit Button Text' },
              { type: 'string', name: 'sending', label: 'Sending Button Text' },
            ],
          },
        ],
      },
      {
        name: 'domainTransfer',
        label: 'Domain Transfer Page',
        path: 'translations/domain-transfer',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'badge', label: 'Badge' },
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'searchPlaceholder', label: 'Search Placeholder' },
              { type: 'string', name: 'searchButton', label: 'Search Button Text' },
              { type: 'string', name: 'checking', label: 'Checking Text' },
              { type: 'string', name: 'errorEmpty', label: 'Empty Error Text' },
              { type: 'string', name: 'statusLocked', label: 'Locked Status' },
              { type: 'string', name: 'statusUnlocked', label: 'Unlocked Status' },
              { type: 'string', name: 'currentRegistrar', label: 'Current Registrar Label' },
              { type: 'string', name: 'registrarLock', label: 'Registrar Lock Label' },
              { type: 'string', name: 'unlockSteps', label: 'Unlock Steps Label' },
              { type: 'string', name: 'checkAgain', label: 'Check Again Label' },
              { type: 'string', name: 'whyTransfer', label: 'Why Transfer Label' },
              { type: 'string', name: 'whyTransferDesc', label: 'Why Transfer Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'lookingForNew', label: 'Looking For New Label' },
              { type: 'string', name: 'tryDomainChecker', label: 'Try Domain Checker Text' },
              { type: 'string', name: 'domainSearchLink', label: 'Domain Search Link' },
              { type: 'string', name: 'defaultRegistrar', label: 'Default Registrar' },
              { type: 'string', name: 'defaultExpiry', label: 'Default Expiry' },
              { type: 'string', name: 'defaultPrice', label: 'Default Price' },
              { type: 'string', name: 'defaultOriginalPrice', label: 'Default Original Price' },
              {
                type: 'string',
                name: 'suggestions',
                label: 'Domain Suggestions',
                list: true,
              },
              {
                type: 'object',
                name: 'demoRegistrars',
                label: 'Demo Registrars',
                list: true,
                fields: [
                  { type: 'string', name: 'domain', label: 'Domain' },
                  { type: 'string', name: 'registrar', label: 'Registrar' },
                  { type: 'boolean', name: 'locked', label: 'Locked' },
                  { type: 'string', name: 'expiry', label: 'Expiry' },
                ],
              },
              {
                type: 'object',
                name: 'features',
                label: 'Features',
                fields: [
                  { type: 'string', name: 'freeYear', label: 'Free Year' },
                  { type: 'string', name: 'whoisPrivacy', label: 'WHOIS Privacy' },
                  { type: 'string', name: 'easyManagement', label: 'Easy Management' },
                  { type: 'string', name: 'support', label: 'Support' },
                ],
              },
              {
                type: 'object',
                name: 'modal',
                label: 'Unlock Modal',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'registrarGuides', label: 'Registrar Guides' },
                  { type: 'string', name: 'needHelp', label: 'Need Help' },
                  { type: 'string', name: 'needHelpDesc', label: 'Need Help Description', ui: { component: 'textarea' } },
                  { type: 'string', name: 'gotIt', label: 'Got It Button' },
                  {
                    type: 'object',
                    name: 'unlockSteps',
                    label: 'Unlock Steps',
                    list: true,
                    fields: [
                      { type: 'number', name: 'step', label: 'Step' },
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'registrars',
                    label: 'Registrars',
                    list: true,
                    fields: [
                      { type: 'string', name: 'name', label: 'Name' },
                      { type: 'string', name: 'url', label: 'URL' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'steps',
            label: 'Transfer Steps',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'cta', label: 'CTA Button Text' },
              { type: 'string', name: 'ctaLink', label: 'CTA Button Link' },
              { type: 'string', name: 'scrollHint', label: 'Scroll Hint' },
              { type: 'string', name: 'scrollHintUp', label: 'Scroll Hint Up' },
              {
                type: 'object',
                name: 'cards',
                label: 'Steps',
                list: true,
                fields: [
                  { type: 'string', name: 'heading', label: 'Heading' },
                  { type: 'string', name: 'text', label: 'Text', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              {
                type: 'object',
                name: 'questions',
                label: 'Questions',
                list: true,
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'CTA Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'buttonLink', label: 'Button Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email Address' },
              { type: 'string', name: 'phone', label: 'Phone Number' },
              {
                type: 'object',
                name: 'info',
                label: 'Contact Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contactForm',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'nameLabel', label: 'Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'messageLabel', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submitButton', label: 'Submit Button Text' },
              { type: 'string', name: 'sending', label: 'Sending Button Text' },
            ],
          },
        ],
      },
      {
        name: 'blogPage',
        label: 'Blog Page',
        path: 'translations/blog',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          { type: 'string', name: 'heading', label: 'Heading' },
          { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
          {
            type: 'object',
            name: 'hero',
            label: 'Hero',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
            ],
          },
          { type: 'string', name: 'loading', label: 'Loading Text' },
          { type: 'string', name: 'latestPosts', label: 'Latest Posts Label' },
          {
            type: 'object',
            name: 'empty',
            label: 'Empty State',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
            ],
          },
          { type: 'string', name: 'fallbackImage', label: 'Fallback Image' },
          { type: 'string', name: 'defaultReadTime', label: 'Default Read Time' },
          { type: 'string', name: 'fallbackCategoryIcon', label: 'Fallback Category Icon' },
          {
            type: 'object',
            name: 'routes',
            label: 'Routes',
            fields: [
              { type: 'string', name: 'blogBase', label: 'Blog Base' },
              { type: 'string', name: 'categoryBase', label: 'Category Base' },
              { type: 'string', name: 'postBase', label: 'Post Base' },
            ],
          },
          {
            type: 'object',
            name: 'categories',
            label: 'Categories',
            fields: [
              { type: 'string', name: 'all', label: 'All Label' },
            ],
          },
          {
            type: 'object',
            name: 'categoryNames',
            label: 'Category Names (for translations)',
            description: 'Category name translations for different languages',
            fields: [
              { type: 'string', name: 'hosting', label: 'Hosting' },
              { type: 'string', name: 'wordpress', label: 'WordPress' },
              { type: 'string', name: 'domains', label: 'Domains' },
              { type: 'string', name: 'tutorials', label: 'Tutorials' },
              { type: 'string', name: 'guides', label: 'Guides' },
              { type: 'string', name: 'security', label: 'Security' },
            ],
          },
          {
            type: 'object',
            name: 'cta',
            label: 'CTA Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading', ui: { component: 'textarea' } },
              { type: 'string', name: 'trustedBy', label: 'Trusted By HTML', ui: { component: 'textarea' } },
              { type: 'string', name: 'viewPlans', label: 'View Plans Label' },
              {
                type: 'object',
                name: 'webHosting',
                label: 'Web Hosting Card',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                  { type: 'string', name: 'link', label: 'Link' },
                ],
              },
              {
                type: 'object',
                name: 'wordpressHosting',
                label: 'WordPress Hosting Card',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                  { type: 'string', name: 'link', label: 'Link' },
                ],
              },
              {
                type: 'object',
                name: 'vpsHosting',
                label: 'VPS Hosting Card',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                  { type: 'string', name: 'link', label: 'Link' },
                ],
              },
              {
                type: 'object',
                name: 'ecommerceHosting',
                label: 'E-commerce Hosting Card',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                  { type: 'string', name: 'link', label: 'Link' },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'pricingPages',
        label: 'Pricing Sub-Pages',
        path: 'translations/pricing',
        format: 'json',
        match: {
          include: '{web-hosting,vps-hosting,domains}/{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'badge', label: 'Badge' },
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'cta', label: 'CTA Button' },
              { type: 'string', name: 'moneyBack', label: 'Money Back Guarantee' },
              {
                type: 'object',
                name: 'navigationItems',
                label: 'Service Navigation Items',
                list: true,
                fields: [
                  { type: 'string', name: 'name', label: 'Label' },
                  { type: 'string', name: 'href', label: 'Link' },
                  { type: 'boolean', name: 'popular', label: 'Popular' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'pricing',
            label: 'Pricing Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'mostPopular', label: 'Most Popular Label' },
              { type: 'string', name: 'cta', label: 'CTA Button' },
              { type: 'string', name: 'firstYear', label: 'First Year Label' },
              { type: 'string', name: 'standardRate', label: 'Standard Rate Label' },
              { type: 'string', name: 'billedAnnually', label: 'Billed Annually Label' },
              { type: 'string', name: 'from', label: 'From Label' },
              { type: 'string', name: 'youSave', label: 'You Save Label' },
              { type: 'string', name: 'orderLinkBase', label: 'Order Link Base' },
              { type: 'string', name: 'renewAt', label: 'Renews At Label' },
              { type: 'string', name: 'perMonth', label: 'Per Month Label' },
              { type: 'string', name: 'selectPlan', label: 'Select Plan Label' },
              {
                type: 'object',
                name: 'features',
                label: 'Features Keys',
                fields: [
                  { type: 'string', name: 'websites', label: 'Websites' },
                  { type: 'string', name: 'storage', label: 'Storage' },
                  { type: 'string', name: 'bandwidth', label: 'Bandwidth' },
                  { type: 'string', name: 'ssl', label: 'SSL' },
                  { type: 'string', name: 'backup', label: 'Backup' },
                  { type: 'string', name: 'email', label: 'Email' },
                  { type: 'string', name: 'cdn', label: 'CDN' },
                  { type: 'string', name: 'vcpu', label: 'vCPU' },
                  { type: 'string', name: 'ram', label: 'RAM' },
                  { type: 'string', name: 'rootAccess', label: 'Root Access' },
                  { type: 'string', name: 'dedicatedIp', label: 'Dedicated IP' },
                  { type: 'string', name: 'managed', label: 'Managed' },
                  { type: 'string', name: 'acceleration', label: 'Acceleration' },
                  { type: 'string', name: 'wpcli', label: 'WP-CLI' },
                  { type: 'string', name: 'autoUpdates', label: 'Auto Updates' },
                  { type: 'string', name: 'prioritySupport', label: 'Priority Support' },
                  { type: 'string', name: 'dailyBackups', label: 'Daily Backups' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'hostingTypes',
            label: 'Hosting Types Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'getStarted', label: 'Get Started' },
              {
                type: 'object',
                name: 'labels',
                label: 'Labels',
                fields: [
                  { type: 'string', name: 'websites', label: 'Websites' },
                  { type: 'string', name: 'performance', label: 'Performance' },
                  { type: 'string', name: 'storage', label: 'Storage' },
                  { type: 'string', name: 'ssl', label: 'SSL' },
                  { type: 'string', name: 'unlimited', label: 'Unlimited' },
                  { type: 'string', name: 'managedWp', label: 'Managed WP' },
                  { type: 'string', name: 'included', label: 'Included' },
                ]
              },
              {
                type: 'object',
                name: 'performanceLevels',
                label: 'Performance Levels',
                fields: [
                  { type: 'string', name: 'standard', label: 'Standard' },
                  { type: 'string', name: 'increased', label: 'Increased' },
                  { type: 'string', name: 'maximum', label: 'Maximum' },
                ]
              },
              {
                type: 'object',
                name: 'fallbackValues',
                label: 'Fallback Values',
                fields: [
                  { type: 'string', name: 'websites', label: 'Websites fallback value' },
                  { type: 'string', name: 'storage', label: 'Storage fallback value' },
                ]
              },
              {
                type: 'object',
                name: 'planMetrics',
                label: 'Plan Metrics',
                list: true,
                fields: [
                  { type: 'string', name: 'key', label: 'Plan key (starter/business/pro)' },
                  { type: 'string', name: 'iconKey', label: 'Icon key (starter/business/pro)' },
                  { type: 'string', name: 'performanceLevel', label: 'Performance level (Low/Medium/High)' },
                  { type: 'string', name: 'websites', label: 'Websites / Core count' },
                  { type: 'string', name: 'storage', label: 'Storage value' },
                  { type: 'string', name: 'domains', label: 'Domains count (for domains page)' },
                ],
              }
            ],
          },
          {
            type: 'object',
            name: 'comparison',
            label: 'Comparison Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'popular', label: 'Popular Badge' },
              { type: 'string', name: 'getStarted', label: 'Get Started Label' },
              { type: 'string', name: 'topFeatures', label: 'Top Features Title' },
              { type: 'string', name: 'mailboxes', label: 'Mailboxes Label' },
              { type: 'string', name: 'freeDomain', label: 'Free Domain Label' },
              { type: 'string', name: 'managedWp', label: 'Managed WordPress Label' },
              { type: 'string', name: 'migration', label: 'Migration Label' },
              { type: 'string', name: 'save', label: 'Save Label (supports {percent})' },
              { type: 'string', name: 'perMonthSuffix', label: 'Per-month suffix' },
              { type: 'string', name: 'security', label: 'Security Section Title' },
              { type: 'string', name: 'support', label: 'Support Section Title' },
              { type: 'string', name: 'choose', label: 'Choose Button Label' },
              { type: 'string', name: 'cancelAnytime', label: 'Cancel Anytime Label' },
              {
                type: 'object',
                name: 'topFeaturesList',
                label: 'Top Features List',
                list: true,
                fields: [
                  { type: 'string', name: 'feature', label: 'Feature Name' },
                  { type: 'string', name: 'plan1', label: 'Plan 1 Value (Use "true" for checkmark, "false" for minus)' },
                  { type: 'string', name: 'plan2', label: 'Plan 2 Value' },
                  { type: 'string', name: 'plan3', label: 'Plan 3 Value' },
                ],
              },
              {
                type: 'object',
                name: 'securityFeatures',
                label: 'Security Features',
                list: true,
                fields: [
                  { type: 'string', name: 'feature', label: 'Feature Name' },
                  { type: 'string', name: 'plan1', label: 'Plan 1 Value (Use "true" for checkmark, "false" for minus)' },
                  { type: 'string', name: 'plan2', label: 'Plan 2 Value' },
                  { type: 'string', name: 'plan3', label: 'Plan 3 Value' },
                ],
              },
              {
                type: 'object',
                name: 'supportFeatures',
                label: 'Service & Support Features',
                list: true,
                fields: [
                  { type: 'string', name: 'feature', label: 'Feature Name' },
                  { type: 'string', name: 'plan1', label: 'Plan 1 Value (Use "true" for checkmark, "false" for minus)' },
                  { type: 'string', name: 'plan2', label: 'Plan 2 Value' },
                  { type: 'string', name: 'plan3', label: 'Plan 3 Value' },
                ],
              },

            ],
          },
          {
            type: 'object',
            name: 'enjoyAllThis',
            label: 'Enjoy All This Section',
            fields: [
              { type: 'string', name: 'title1', label: 'Title Line 1' },
              { type: 'string', name: 'title2', label: 'Title Line 2' },
              {
                type: 'object',
                name: 'features',
                label: 'Features',
                fields: [
                  { type: 'string', name: 'ssl', label: 'SSL' },
                  { type: 'string', name: 'domain', label: 'Domain' },
                  { type: 'string', name: 'backups', label: 'Backups' },
                  { type: 'string', name: 'email', label: 'Email' },
                  { type: 'string', name: 'traffic', label: 'Traffic' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              {
                type: 'object',
                name: 'items',
                label: 'FAQ Items',
                list: true,
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email' },
              { type: 'string', name: 'phone', label: 'Phone' },
              {
                type: 'object',
                name: 'info',
                label: 'Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social',
                    fields: [{ type: 'string', name: 'title', label: 'Share Title' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contactForm',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'nameLabel', label: 'Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'messageLabel', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submitButton', label: 'Submit Button Label' },
              { type: 'string', name: 'sending', label: 'Sending Label' },
            ],
          },
          {
            type: 'object',
            name: 'search',
            label: 'Domain Search Section (domains page only)',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'subDescription', label: 'Sub Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'placeholder', label: 'Placeholder' },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'searching', label: 'Searching Text' },
              { type: 'string', name: 'resultsFor', label: 'Results For Label' },
              { type: 'string', name: 'available', label: 'Available Text' },
              { type: 'string', name: 'taken', label: 'Taken Text' },
              { type: 'string', name: 'year', label: 'Year Label' },
              { type: 'string', name: 'availableBadge', label: 'Available Badge' },
              { type: 'string', name: 'takenBadge', label: 'Taken Badge' },
              { type: 'string', name: 'registerNow', label: 'Register Now Button' },
              { type: 'string', name: 'noResults', label: 'No Results Message' },
              { type: 'string', name: 'errorEmpty', label: 'Empty Error Message' },
              { type: 'string', name: 'errorFailed', label: 'Failed Error Message' },
              {
                type: 'string',
                name: 'suggestions',
                label: 'Search Suggestions (JSON array)',
                list: true,
              },
              {
                type: 'string',
                name: 'popularTlds',
                label: 'Popular TLDs (JSON array)',
                list: true,
              },
            ],
          },
          {
            type: 'object',
            name: 'whyChoose',
            label: 'Why Choose Section (domains page only)',
            fields: [
              { type: 'string', name: 'title1', label: 'Title Line 1' },
              { type: 'string', name: 'title2', label: 'Title Line 2' },
              {
                type: 'object',
                name: 'features',
                label: 'Features',
                fields: [
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Feature',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'privacy',
                    label: 'Privacy Feature',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'management',
                    label: 'Management Feature',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'registrar',
                    label: 'Registrar Feature',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'tips',
            label: 'Tips Section (domains page only)',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'items',
                label: 'Tip Items',
                fields: [
                  {
                    type: 'object',
                    name: 'short',
                    label: 'Short Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'simple',
                    label: 'Simple Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'brand',
                    label: 'Brand Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'availability',
                    label: 'Availability Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'local',
                    label: 'Local Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'fast',
                    label: 'Fast Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'features',
            label: 'Features Section (web-hosting, vps, wordpress pages)',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'performance',
                label: 'Performance Feature',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
              {
                type: 'object',
                name: 'security',
                label: 'Security Feature',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
              {
                type: 'object',
                name: 'support',
                label: 'Support Feature',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
              {
                type: 'object',
                name: 'staging',
                label: 'Staging Feature (WordPress only)',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'wordpressPricingPages',
        label: 'WordPress Pricing Page',
        path: 'translations/pricing',
        format: 'json',
        match: {
          include: 'wordpress-hosting/{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hero',
            label: 'Hero Section',
            fields: [
              { type: 'string', name: 'badge', label: 'Badge' },
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'cta', label: 'CTA Button' },
              { type: 'string', name: 'moneyBack', label: 'Money Back Guarantee' },
              {
                type: 'object',
                name: 'navigationItems',
                label: 'Service Navigation Items',
                list: true,
                fields: [
                  { type: 'string', name: 'name', label: 'Label' },
                  { type: 'string', name: 'href', label: 'Link' },
                  { type: 'boolean', name: 'popular', label: 'Popular' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'pricing',
            label: 'Pricing Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'mostPopular', label: 'Most Popular Label' },
              { type: 'string', name: 'cta', label: 'CTA Button' },
              { type: 'string', name: 'firstYear', label: 'First Year Label' },
              { type: 'string', name: 'standardRate', label: 'Standard Rate Label' },
              { type: 'string', name: 'billedAnnually', label: 'Billed Annually Label' },
              { type: 'string', name: 'from', label: 'From Label' },
              { type: 'string', name: 'youSave', label: 'You Save Label' },
              { type: 'string', name: 'orderLinkBase', label: 'Order Link Base' },
              { type: 'string', name: 'renewAt', label: 'Renews At Label' },
              { type: 'string', name: 'perMonth', label: 'Per Month Label' },
              { type: 'string', name: 'selectPlan', label: 'Select Plan Label' },
              {
                type: 'object',
                name: 'features',
                label: 'Features Keys',
                fields: [
                  { type: 'string', name: 'websites', label: 'Websites' },
                  { type: 'string', name: 'storage', label: 'Storage' },
                  { type: 'string', name: 'bandwidth', label: 'Bandwidth' },
                  { type: 'string', name: 'ssl', label: 'SSL' },
                  { type: 'string', name: 'backup', label: 'Backup' },
                  { type: 'string', name: 'email', label: 'Email' },
                  { type: 'string', name: 'cdn', label: 'CDN' },
                  { type: 'string', name: 'vcpu', label: 'vCPU' },
                  { type: 'string', name: 'ram', label: 'RAM' },
                  { type: 'string', name: 'rootAccess', label: 'Root Access' },
                  { type: 'string', name: 'dedicatedIp', label: 'Dedicated IP' },
                  { type: 'string', name: 'managed', label: 'Managed' },
                  { type: 'string', name: 'acceleration', label: 'Acceleration' },
                  { type: 'string', name: 'wpcli', label: 'WP-CLI' },
                  { type: 'string', name: 'autoUpdates', label: 'Auto Updates' },
                  { type: 'string', name: 'prioritySupport', label: 'Priority Support' },
                  { type: 'string', name: 'dailyBackups', label: 'Daily Backups' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'hostingTypes',
            label: 'Hosting Types Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'getStarted', label: 'Get Started' },
              {
                type: 'object',
                name: 'labels',
                label: 'Labels',
                fields: [
                  { type: 'string', name: 'websites', label: 'Websites' },
                  { type: 'string', name: 'performance', label: 'Performance' },
                  { type: 'string', name: 'storage', label: 'Storage' },
                  { type: 'string', name: 'ssl', label: 'SSL' },
                  { type: 'string', name: 'unlimited', label: 'Unlimited' },
                  { type: 'string', name: 'managedWp', label: 'Managed WP' },
                  { type: 'string', name: 'included', label: 'Included' },
                ]
              },
              {
                type: 'object',
                name: 'performanceLevels',
                label: 'Performance Levels',
                fields: [
                  { type: 'string', name: 'standard', label: 'Standard' },
                  { type: 'string', name: 'increased', label: 'Increased' },
                  { type: 'string', name: 'maximum', label: 'Maximum' },
                ]
              },
              {
                type: 'object',
                name: 'fallbackValues',
                label: 'Fallback Values',
                fields: [
                  { type: 'string', name: 'websites', label: 'Websites fallback value' },
                  { type: 'string', name: 'storage', label: 'Storage fallback value' },
                ]
              },
              {
                type: 'object',
                name: 'planMetrics',
                label: 'Plan Metrics',
                list: true,
                fields: [
                  { type: 'string', name: 'key', label: 'Plan key (starter/business/pro)' },
                  { type: 'string', name: 'iconKey', label: 'Icon key (starter/business/pro)' },
                  { type: 'string', name: 'performanceLevel', label: 'Performance level (Low/Medium/High)' },
                  { type: 'string', name: 'websites', label: 'Websites / Core count' },
                  { type: 'string', name: 'storage', label: 'Storage value' },
                  { type: 'string', name: 'domains', label: 'Domains count (for domains page)' },
                ],
              }
            ],
          },
          {
            type: 'object',
            name: 'comparison',
            label: 'Comparison Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              { type: 'string', name: 'popular', label: 'Popular Badge' },
              { type: 'string', name: 'getStarted', label: 'Get Started Label' },
              { type: 'string', name: 'topFeatures', label: 'Top Features Title' },
              { type: 'string', name: 'topFeaturesIcon', label: 'Top Features Icon (e.g., Star, Zap, Award)' },
              { type: 'string', name: 'wordpress', label: 'WordPress Section Title' },
              { type: 'string', name: 'wordpressIcon', label: 'WordPress Icon (e.g., Code, Globe, Layers)' },
              { type: 'string', name: 'mailboxes', label: 'Mailboxes Label' },
              { type: 'string', name: 'freeDomain', label: 'Free Domain Label' },
              { type: 'string', name: 'managedWp', label: 'Managed WordPress Label' },
              { type: 'string', name: 'migration', label: 'Migration Label' },
              { type: 'string', name: 'save', label: 'Save Label (supports {percent})' },
              { type: 'string', name: 'perMonthSuffix', label: 'Per-month suffix' },
              { type: 'string', name: 'security', label: 'Security Section Title' },
              { type: 'string', name: 'support', label: 'Support Section Title' },
              { type: 'string', name: 'supportIcon', label: 'Support Icon (e.g., Headphones, MessageCircle, Shield)' },
              { type: 'string', name: 'choose', label: 'Choose Button Label' },
              { type: 'string', name: 'cancelAnytime', label: 'Cancel Anytime Label' },
              {
                type: 'object',
                name: 'topFeaturesList',
                label: 'Top Features List',
                list: true,
                fields: [
                  { type: 'string', name: 'feature', label: 'Feature Name' },
                  { type: 'string', name: 'plan1', label: 'Plan 1 Value (Use "true" for checkmark, "false" for minus)' },
                  { type: 'string', name: 'plan2', label: 'Plan 2 Value' },
                  { type: 'string', name: 'plan3', label: 'Plan 3 Value' },
                ],
              },

              {
                type: 'object',
                name: 'supportFeatures',
                label: 'Service & Support Features',
                list: true,
                fields: [
                  { type: 'string', name: 'feature', label: 'Feature Name' },
                  { type: 'string', name: 'plan1', label: 'Plan 1 Value (Use "true" for checkmark, "false" for minus)' },
                  { type: 'string', name: 'plan2', label: 'Plan 2 Value' },
                  { type: 'string', name: 'plan3', label: 'Plan 3 Value' },
                ],
              },
              {
                type: 'object',
                name: 'wordpressFeatures',
                label: 'WordPress Features',
                list: true,
                fields: [
                  { type: 'string', name: 'feature', label: 'Feature Name' },
                  { type: 'string', name: 'plan1', label: 'Plan 1 Value (Use "true" for checkmark, "false" for minus)' },
                  { type: 'string', name: 'plan2', label: 'Plan 2 Value' },
                  { type: 'string', name: 'plan3', label: 'Plan 3 Value' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'enjoyAllThis',
            label: 'Enjoy All This Section',
            fields: [
              { type: 'string', name: 'title1', label: 'Title Line 1' },
              { type: 'string', name: 'title2', label: 'Title Line 2' },
              {
                type: 'object',
                name: 'features',
                label: 'Features',
                fields: [
                  { type: 'string', name: 'ssl', label: 'SSL' },
                  { type: 'string', name: 'domain', label: 'Domain' },
                  { type: 'string', name: 'backups', label: 'Backups' },
                  { type: 'string', name: 'email', label: 'Email' },
                  { type: 'string', name: 'traffic', label: 'Traffic' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'faq',
            label: 'FAQ Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              {
                type: 'object',
                name: 'items',
                label: 'FAQ Items',
                list: true,
                fields: [
                  { type: 'string', name: 'question', label: 'Question' },
                  { type: 'string', name: 'answer', label: 'Answer', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'subheading', label: 'Subheading' },
              { type: 'string', name: 'description1', label: 'Description 1', ui: { component: 'textarea' } },
              { type: 'string', name: 'description2', label: 'Description 2', ui: { component: 'textarea' } },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'phoneLabel', label: 'Phone Label' },
              { type: 'string', name: 'email', label: 'Email' },
              { type: 'string', name: 'phone', label: 'Phone' },
              {
                type: 'object',
                name: 'info',
                label: 'Info',
                fields: [
                  {
                    type: 'object',
                    name: 'social',
                    label: 'Social',
                    fields: [{ type: 'string', name: 'title', label: 'Share Title' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'contactForm',
            label: 'Contact Form',
            fields: [
              { type: 'string', name: 'nameLabel', label: 'Name Label' },
              { type: 'string', name: 'firstNamePlaceholder', label: 'First Name Placeholder' },
              { type: 'string', name: 'lastNamePlaceholder', label: 'Last Name Placeholder' },
              { type: 'string', name: 'emailLabel', label: 'Email Label' },
              { type: 'string', name: 'emailPlaceholder', label: 'Email Placeholder' },
              { type: 'string', name: 'messageLabel', label: 'Message Label' },
              { type: 'string', name: 'messagePlaceholder', label: 'Message Placeholder' },
              { type: 'string', name: 'submitButton', label: 'Submit Button Label' },
              { type: 'string', name: 'sending', label: 'Sending Label' },
            ],
          },
          {
            type: 'object',
            name: 'search',
            label: 'Domain Search Section (domains page only)',
            fields: [
              { type: 'string', name: 'heading', label: 'Heading' },
              { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'subDescription', label: 'Sub Description', ui: { component: 'textarea' } },
              { type: 'string', name: 'placeholder', label: 'Placeholder' },
              { type: 'string', name: 'button', label: 'Button Text' },
              { type: 'string', name: 'searching', label: 'Searching Text' },
              { type: 'string', name: 'resultsFor', label: 'Results For Label' },
              { type: 'string', name: 'available', label: 'Available Text' },
              { type: 'string', name: 'taken', label: 'Taken Text' },
              { type: 'string', name: 'year', label: 'Year Label' },
              { type: 'string', name: 'availableBadge', label: 'Available Badge' },
              { type: 'string', name: 'takenBadge', label: 'Taken Badge' },
              { type: 'string', name: 'registerNow', label: 'Register Now Button' },
              { type: 'string', name: 'noResults', label: 'No Results Message' },
              { type: 'string', name: 'errorEmpty', label: 'Empty Error Message' },
              { type: 'string', name: 'errorFailed', label: 'Failed Error Message' },
              {
                type: 'string',
                name: 'suggestions',
                label: 'Search Suggestions (JSON array)',
                list: true,
              },
              {
                type: 'string',
                name: 'popularTlds',
                label: 'Popular TLDs (JSON array)',
                list: true,
              },
            ],
          },
          {
            type: 'object',
            name: 'whyChoose',
            label: 'Why Choose Section (domains page only)',
            fields: [
              { type: 'string', name: 'title1', label: 'Title Line 1' },
              { type: 'string', name: 'title2', label: 'Title Line 2' },
              {
                type: 'object',
                name: 'features',
                label: 'Features',
                fields: [
                  {
                    type: 'object',
                    name: 'support',
                    label: 'Support Feature',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'privacy',
                    label: 'Privacy Feature',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'management',
                    label: 'Management Feature',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'registrar',
                    label: 'Registrar Feature',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'tips',
            label: 'Tips Section (domains page only)',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'items',
                label: 'Tip Items',
                fields: [
                  {
                    type: 'object',
                    name: 'short',
                    label: 'Short Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'simple',
                    label: 'Simple Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'brand',
                    label: 'Brand Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'availability',
                    label: 'Availability Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'local',
                    label: 'Local Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                  {
                    type: 'object',
                    name: 'fast',
                    label: 'Fast Tip',
                    fields: [
                      { type: 'string', name: 'title', label: 'Title' },
                      { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'features',
            label: 'Features Section (web-hosting, vps, wordpress pages)',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'subtitle', label: 'Subtitle', ui: { component: 'textarea' } },
              {
                type: 'object',
                name: 'performance',
                label: 'Performance Feature',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
              {
                type: 'object',
                name: 'security',
                label: 'Security Feature',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
              {
                type: 'object',
                name: 'support',
                label: 'Support Feature',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
              {
                type: 'object',
                name: 'staging',
                label: 'Staging Feature (WordPress only)',
                fields: [
                  { type: 'string', name: 'title', label: 'Title' },
                  { type: 'string', name: 'description', label: 'Description', ui: { component: 'textarea' } },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'footer',
        label: 'Footer Content',
        path: 'translations/footer',
        format: 'json',
        match: {
          include: '{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'hosting',
            label: 'Hosting Section',
            fields: [
              { type: 'string', name: 'title', label: 'Section Title' },
              { type: 'string', name: 'sharedHosting', label: 'Shared Hosting' },
              { type: 'string', name: 'sharedHostingLink', label: 'Shared Hosting Link' },
              { type: 'string', name: 'wordpressHosting', label: 'WordPress Hosting' },
              { type: 'string', name: 'wordpressHostingLink', label: 'WordPress Hosting Link' },
              { type: 'string', name: 'vpsHosting', label: 'VPS Hosting' },
              { type: 'string', name: 'vpsHostingLink', label: 'VPS Hosting Link' },
              { type: 'string', name: 'ecommerceHosting', label: 'E-commerce Hosting' },
              { type: 'string', name: 'ecommerceHostingLink', label: 'E-commerce Hosting Link' },
              { type: 'string', name: 'pricing', label: 'Pricing' },
              { type: 'string', name: 'pricingLink', label: 'Pricing Link' },
            ],
          },
          {
            type: 'object',
            name: 'domains',
            label: 'Domains Section',
            fields: [
              { type: 'string', name: 'title', label: 'Section Title' },
              { type: 'string', name: 'domainSearch', label: 'Domain Search' },
              { type: 'string', name: 'domainSearchLink', label: 'Domain Search Link' },
              { type: 'string', name: 'domainTransfer', label: 'Domain Transfer' },
              { type: 'string', name: 'domainTransferLink', label: 'Domain Transfer Link' },
            ],
          },
          {
            type: 'object',
            name: 'ourServices',
            label: 'Other Services Section',
            fields: [
              { type: 'string', name: 'title', label: 'Section Title' },
              { type: 'string', name: 'vpn', label: 'VPN' },
              { type: 'string', name: 'vpnLink', label: 'VPN Link' },
              { type: 'string', name: 'seoTool', label: 'SEO Tool' },
              { type: 'string', name: 'seoToolLink', label: 'SEO Tool Link' },
              { type: 'string', name: 'sitebuilder', label: 'Sitebuilder for E-commerce' },
              { type: 'string', name: 'sitebuilderLink', label: 'Sitebuilder Link' },
              { type: 'string', name: 'ssl', label: 'SSL Certificates' },
              { type: 'string', name: 'sslLink', label: 'SSL Link' },
            ],
          },
          {
            type: 'object',
            name: 'support',
            label: 'Company Section',
            fields: [
              { type: 'string', name: 'title', label: 'Section Title' },
              { type: 'string', name: 'about', label: 'About' },
              { type: 'string', name: 'aboutLink', label: 'About Link' },
              { type: 'string', name: 'contact', label: 'Contact' },
              { type: 'string', name: 'contactLink', label: 'Contact Link' },
              { type: 'string', name: 'blog', label: 'Blog' },
              { type: 'string', name: 'blogLink', label: 'Blog Link' },
              { type: 'string', name: 'guides', label: 'Guides' },
              { type: 'string', name: 'guidesLink', label: 'Guides Link' },
            ],
          },
          { type: 'string', name: 'copyright', label: 'Copyright Text', description: 'Use {year} as placeholder for year' },
          {
            type: 'object',
            name: 'policy',
            label: 'Policy Links',
            fields: [
              { type: 'string', name: 'privacy', label: 'Privacy Policy' },
              { type: 'string', name: 'privacyLink', label: 'Privacy Policy Link' },
              { type: 'string', name: 'terms', label: 'Terms of Service' },
              { type: 'string', name: 'termsLink', label: 'Terms Link' },
              { type: 'string', name: 'cookie', label: 'Cookie Policy' },
              { type: 'string', name: 'cookieLink', label: 'Cookie Policy Link' },
            ],
          },
          {
            type: 'object',
            name: 'social',
            label: 'Social Media Links',
            fields: [
              { type: 'string', name: 'instagram', label: 'Instagram URL' },
              { type: 'string', name: 'facebook', label: 'Facebook URL' },
              { type: 'string', name: 'twitter', label: 'Twitter URL' },
              { type: 'string', name: 'youtube', label: 'YouTube URL' },
              { type: 'string', name: 'linkedin', label: 'LinkedIn URL' },
              { type: 'string', name: 'github', label: 'GitHub URL' },
            ],
          },
        ],
      },
      {
        name: 'productPlans',
        label: 'Product Plans (WHMCS)',
        path: 'translations/product-plans',
        format: 'json',
        match: {
          include: '{shared,wordpress,vps,ecommerce}/{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'object',
            name: 'plans',
            label: 'Plans',
            list: true,
            fields: [
              {
                type: 'number',
                name: 'whmcsProductId',
                label: 'WHMCS Product ID',
              },
              { type: 'string', name: 'name', label: 'Name' },
              { type: 'string', name: 'tagline', label: 'Tagline' },
              { type: 'string', name: 'description', label: 'Description' },
              {
                type: 'string',
                name: 'features',
                label: 'Features',
                list: true,
              },
            ],
          },
        ],
      },
      {
        name: 'legalPages',
        label: 'Legal Pages',
        path: 'content/legal',
        format: 'json',
        match: {
          include: '{privacy-policy,terms-of-service,cookie-policy}/{en,sv}',
        },
        ui: {
          filename: {
            readonly: true,
          },
        },
        fields: [
          {
            type: 'string',
            name: 'title',
            label: 'Page Title',
            required: true,
          },
          {
            type: 'string',
            name: 'pageLastUpdated',
            label: 'Last Updated Date',
            required: true,
          },
          {
            type: 'rich-text',
            name: 'introduction',
            label: 'Introduction',
          },
          {
            type: 'object',
            name: 'breadcrumb',
            label: 'Breadcrumb',
            fields: [
              { type: 'string', name: 'home', label: 'Home Label' },
              { type: 'string', name: 'legal', label: 'Legal Label' },
            ],
          },
          {
            type: 'string',
            name: 'lastUpdated',
            label: 'Last Updated Label',
          },
          {
            type: 'object',
            name: 'sidebar',
            label: 'Sidebar',
            fields: [
              { type: 'string', name: 'title', label: 'Sidebar Title' },
            ],
          },
          {
            type: 'object',
            name: 'links',
            label: 'Navigation Links',
            fields: [
              { type: 'string', name: 'privacyPolicy', label: 'Privacy Policy Link' },
              { type: 'string', name: 'termsOfService', label: 'Terms of Service Link' },
              { type: 'string', name: 'cookiePolicy', label: 'Cookie Policy Link' },
            ],
          },
          {
            type: 'object',
            name: 'contact',
            label: 'Contact Section',
            fields: [
              { type: 'string', name: 'title', label: 'Title' },
              { type: 'string', name: 'description', label: 'Description' },
              { type: 'string', name: 'button', label: 'Button Text' },
            ],
          },
          {
            type: 'object',
            name: 'sections',
            label: 'Content Sections',
            list: true,
            ui: {
              itemProps: (item) => ({ label: item.title }),
            },
            fields: [
              {
                type: 'string',
                name: 'title',
                label: 'Section Title',
                required: true,
              },
              {
                type: 'rich-text',
                name: 'content',
                label: 'Content',
              },
              {
                type: 'object',
                name: 'subsections',
                label: 'Subsections',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item.title }),
                },
                fields: [
                  {
                    type: 'string',
                    name: 'title',
                    label: 'Subsection Title',
                  },
                  {
                    type: 'rich-text',
                    name: 'content',
                    label: 'Subsection Content',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});
