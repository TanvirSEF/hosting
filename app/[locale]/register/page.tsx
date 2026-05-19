'use client';

import { registerUserAction } from '@/actions/register-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Loader2,
  Lock,
  Mail,
  Server,
  Eye,
  EyeOff,
  User,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { CountryCodeSelect } from '@/components/ui/country-code-select';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin } from 'lucide-react';

// Submit button component
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-11 w-full bg-[#8C52FF] text-white hover:bg-[#7b42ff]"
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating account...
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Create Account
        </>
      )}
    </Button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [state, action] = useActionState(registerUserAction, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [countryCode, setCountryCode] = useState('+34'); // Default to Spain
  const [country, setCountry] = useState('ES'); // Default to Spain ISO code

  // Check for pending order on mount
  useEffect(() => {
    const pendingUnifiedOrder = localStorage.getItem('pendingUnifiedOrder');
    const pendingDomainOrder = localStorage.getItem('pendingDomainOrder');
    const pendingHostingOrder = localStorage.getItem('pendingHostingOrder');
    setHasPendingOrder(!!pendingUnifiedOrder || !!pendingDomainOrder || !!pendingHostingOrder);
  }, []);

  // Handle successful registration
  useEffect(() => {
    if (state?.success) {
      toast.success('Account created successfully! Welcome aboard! 🎉');

      const handlePendingOrders = async () => {
        try {
          // Wait a bit to ensure session cookie is properly set
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Always process pending orders via the dedicated processing page
          // so hosting cross-sells/add-ons and invoice generation follow one path.
          router.push('/dashboard/processing');
        } catch (error) {
          console.error('Error processing pending orders:', error);
          router.push('/dashboard');
        }
      };

      if (
        localStorage.getItem('pendingUnifiedOrder') ||
        localStorage.getItem('pendingDomainOrder') ||
        localStorage.getItem('pendingHostingOrder')
      ) {
        handlePendingOrders();
      } else {
        // Check for returnUrl (e.g. for autoCheckout)
        const returnUrl = new URLSearchParams(window.location.search).get(
          'returnUrl'
        );
        if (returnUrl) {
          window.location.href = returnUrl;
          return;
        }

        // Normal flow - redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    }
  }, [state, router]);

  // Password strength indicator
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { strength: 0, label: '', color: '' };
    if (pass.length < 8)
      return { strength: 25, label: 'Weak', color: 'bg-red-500' };

    let strength = 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[a-z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 15;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 10;

    if (strength < 50) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength < 75)
      return { strength, label: 'Medium', color: 'bg-yellow-500' };
    return {
      strength: Math.min(strength, 100),
      label: 'Strong',
      color: 'bg-green-500',
    };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4 py-12 pt-20">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8C52FF] shadow-lg">
              <Server className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              Create Your Account
            </h1>
            <p className="text-muted-foreground">
              Join WebblyHosting today and get started
            </p>
          </div>
        </div>

        {/* Registration Card */}
        <Card className="border-border shadow-lg">
          <form action={action}>
            <CardContent className="space-y-4 pt-6 pb-2">
              {/* Success Message */}
              {state?.success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-600 p-3.5 text-sm text-white">
                  <CheckCircle2 className="h-4 w-4" />
                  {state.message}
                </div>
              )}

              {/* Error Message */}
              {state?.error && (
                <div className="bg-destructive border-destructive/20 rounded-lg border p-3.5 text-sm text-white">
                  {state.error}
                </div>
              )}

              {/* Name Fields - Two columns on desktop */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstname" className="text-sm font-medium">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="firstname"
                      name="firstname"
                      type="text"
                      placeholder="John"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="lastname"
                      name="lastname"
                      type="text"
                      placeholder="Doe"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              {/* Phone Input (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="phonenumber" className="text-sm font-medium">
                  Phone Number{' '}
                  <span className="text-muted-foreground text-xs">
                    (Optional)
                  </span>
                </Label>
                <div className="flex gap-2">
                  <CountryCodeSelect
                    value={countryCode}
                    onValueChange={setCountryCode}
                  />
                  <div className="relative flex-1">
                    <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="phonenumber"
                      name="phonenumber"
                      type="tel"
                      placeholder="1234567890"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
                <input type="hidden" name="countryCode" value={countryCode} />
              </div>

              {/* Address Fields */}
              <div className="space-y-2">
                <Label htmlFor="address1" className="text-sm font-medium">
                  Address 1
                </Label>
                <div className="relative">
                  <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="address1"
                    name="address1"
                    type="text"
                    placeholder="Street Address"
                    required
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2" className="text-sm font-medium">
                  Address 2{' '}
                  <span className="text-muted-foreground text-xs">
                    (Optional)
                  </span>
                </Label>
                <div className="relative">
                  <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="address2"
                    name="address2"
                    type="text"
                    placeholder="Apartment, suite, etc."
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <div className="relative">
                    <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="City"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State/Province
                  </Label>
                  <div className="relative">
                    <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="State"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postcode" className="text-sm font-medium">
                    Postcode
                  </Label>
                  <div className="relative">
                    <MapPin className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      id="postcode"
                      name="postcode"
                      type="text"
                      placeholder="Postcode"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AF">Afghanistan</SelectItem>
                      <SelectItem value="AX">Aland Islands</SelectItem>
                      <SelectItem value="AL">Albania</SelectItem>
                      <SelectItem value="DZ">Algeria</SelectItem>
                      <SelectItem value="AS">American Samoa</SelectItem>
                      <SelectItem value="AD">Andorra</SelectItem>
                      <SelectItem value="AO">Angola</SelectItem>
                      <SelectItem value="AI">Anguilla</SelectItem>
                      <SelectItem value="AQ">Antarctica</SelectItem>
                      <SelectItem value="AG">Antigua and Barbuda</SelectItem>
                      <SelectItem value="AR">Argentina</SelectItem>
                      <SelectItem value="AM">Armenia</SelectItem>
                      <SelectItem value="AW">Aruba</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="AT">Austria</SelectItem>
                      <SelectItem value="AZ">Azerbaijan</SelectItem>
                      <SelectItem value="BS">Bahamas</SelectItem>
                      <SelectItem value="BH">Bahrain</SelectItem>
                      <SelectItem value="BD">Bangladesh</SelectItem>
                      <SelectItem value="BB">Barbados</SelectItem>
                      <SelectItem value="BY">Belarus</SelectItem>
                      <SelectItem value="BE">Belgium</SelectItem>
                      <SelectItem value="BZ">Belize</SelectItem>
                      <SelectItem value="BJ">Benin</SelectItem>
                      <SelectItem value="BM">Bermuda</SelectItem>
                      <SelectItem value="BT">Bhutan</SelectItem>
                      <SelectItem value="BO">Bolivia</SelectItem>
                      <SelectItem value="BQ">Bonaire, Sint Eustatius and Saba</SelectItem>
                      <SelectItem value="BA">Bosnia and Herzegovina</SelectItem>
                      <SelectItem value="BW">Botswana</SelectItem>
                      <SelectItem value="BV">Bouvet Island</SelectItem>
                      <SelectItem value="BR">Brazil</SelectItem>
                      <SelectItem value="IO">British Indian Ocean Territory</SelectItem>
                      <SelectItem value="BN">Brunei Darussalam</SelectItem>
                      <SelectItem value="BG">Bulgaria</SelectItem>
                      <SelectItem value="BF">Burkina Faso</SelectItem>
                      <SelectItem value="BI">Burundi</SelectItem>
                      <SelectItem value="CV">Cabo Verde</SelectItem>
                      <SelectItem value="KH">Cambodia</SelectItem>
                      <SelectItem value="CM">Cameroon</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="KY">Cayman Islands</SelectItem>
                      <SelectItem value="CF">Central African Republic</SelectItem>
                      <SelectItem value="TD">Chad</SelectItem>
                      <SelectItem value="CL">Chile</SelectItem>
                      <SelectItem value="CN">China</SelectItem>
                      <SelectItem value="CX">Christmas Island</SelectItem>
                      <SelectItem value="CC">Cocos (Keeling) Islands</SelectItem>
                      <SelectItem value="CO">Colombia</SelectItem>
                      <SelectItem value="KM">Comoros</SelectItem>
                      <SelectItem value="CD">Congo (Democratic Republic of the)</SelectItem>
                      <SelectItem value="CG">Congo</SelectItem>
                      <SelectItem value="CK">Cook Islands</SelectItem>
                      <SelectItem value="CR">Costa Rica</SelectItem>
                      <SelectItem value="HR">Croatia</SelectItem>
                      <SelectItem value="CU">Cuba</SelectItem>
                      <SelectItem value="CW">Curacao</SelectItem>
                      <SelectItem value="CY">Cyprus</SelectItem>
                      <SelectItem value="CZ">Czechia</SelectItem>
                      <SelectItem value="DK">Denmark</SelectItem>
                      <SelectItem value="DJ">Djibouti</SelectItem>
                      <SelectItem value="DM">Dominica</SelectItem>
                      <SelectItem value="DO">Dominican Republic</SelectItem>
                      <SelectItem value="EC">Ecuador</SelectItem>
                      <SelectItem value="EG">Egypt</SelectItem>
                      <SelectItem value="SV">El Salvador</SelectItem>
                      <SelectItem value="GQ">Equatorial Guinea</SelectItem>
                      <SelectItem value="ER">Eritrea</SelectItem>
                      <SelectItem value="EE">Estonia</SelectItem>
                      <SelectItem value="SZ">Eswatini</SelectItem>
                      <SelectItem value="ET">Ethiopia</SelectItem>
                      <SelectItem value="FK">Falkland Islands (Malvinas)</SelectItem>
                      <SelectItem value="FO">Faroe Islands</SelectItem>
                      <SelectItem value="FJ">Fiji</SelectItem>
                      <SelectItem value="FI">Finland</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="GF">French Guiana</SelectItem>
                      <SelectItem value="PF">French Polynesia</SelectItem>
                      <SelectItem value="TF">French Southern Territories</SelectItem>
                      <SelectItem value="GA">Gabon</SelectItem>
                      <SelectItem value="GM">Gambia</SelectItem>
                      <SelectItem value="GE">Georgia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="GH">Ghana</SelectItem>
                      <SelectItem value="GI">Gibraltar</SelectItem>
                      <SelectItem value="GR">Greece</SelectItem>
                      <SelectItem value="GL">Greenland</SelectItem>
                      <SelectItem value="GD">Grenada</SelectItem>
                      <SelectItem value="GP">Guadeloupe</SelectItem>
                      <SelectItem value="GU">Guam</SelectItem>
                      <SelectItem value="GT">Guatemala</SelectItem>
                      <SelectItem value="GG">Guernsey</SelectItem>
                      <SelectItem value="GN">Guinea</SelectItem>
                      <SelectItem value="GW">Guinea-Bissau</SelectItem>
                      <SelectItem value="GY">Guyana</SelectItem>
                      <SelectItem value="HT">Haiti</SelectItem>
                      <SelectItem value="HM">Heard Island and McDonald Islands</SelectItem>
                      <SelectItem value="VA">Holy See</SelectItem>
                      <SelectItem value="HN">Honduras</SelectItem>
                      <SelectItem value="HK">Hong Kong</SelectItem>
                      <SelectItem value="HU">Hungary</SelectItem>
                      <SelectItem value="IS">Iceland</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="ID">Indonesia</SelectItem>
                      <SelectItem value="IR">Iran</SelectItem>
                      <SelectItem value="IQ">Iraq</SelectItem>
                      <SelectItem value="IE">Ireland</SelectItem>
                      <SelectItem value="IM">Isle of Man</SelectItem>
                      <SelectItem value="IL">Israel</SelectItem>
                      <SelectItem value="IT">Italy</SelectItem>
                      <SelectItem value="JM">Jamaica</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                      <SelectItem value="JE">Jersey</SelectItem>
                      <SelectItem value="JO">Jordan</SelectItem>
                      <SelectItem value="KZ">Kazakhstan</SelectItem>
                      <SelectItem value="KE">Kenya</SelectItem>
                      <SelectItem value="KI">Kiribati</SelectItem>
                      <SelectItem value="KP">Korea (Democratic People's Republic of)</SelectItem>
                      <SelectItem value="KR">Korea (Republic of)</SelectItem>
                      <SelectItem value="KW">Kuwait</SelectItem>
                      <SelectItem value="KG">Kyrgyzstan</SelectItem>
                      <SelectItem value="LA">Lao People's Democratic Republic</SelectItem>
                      <SelectItem value="LV">Latvia</SelectItem>
                      <SelectItem value="LB">Lebanon</SelectItem>
                      <SelectItem value="LS">Lesotho</SelectItem>
                      <SelectItem value="LR">Liberia</SelectItem>
                      <SelectItem value="LY">Libya</SelectItem>
                      <SelectItem value="LI">Liechtenstein</SelectItem>
                      <SelectItem value="LT">Lithuania</SelectItem>
                      <SelectItem value="LU">Luxembourg</SelectItem>
                      <SelectItem value="MO">Macao</SelectItem>
                      <SelectItem value="MG">Madagascar</SelectItem>
                      <SelectItem value="MW">Malawi</SelectItem>
                      <SelectItem value="MY">Malaysia</SelectItem>
                      <SelectItem value="MV">Maldives</SelectItem>
                      <SelectItem value="ML">Mali</SelectItem>
                      <SelectItem value="MT">Malta</SelectItem>
                      <SelectItem value="MH">Marshall Islands</SelectItem>
                      <SelectItem value="MQ">Martinique</SelectItem>
                      <SelectItem value="MR">Mauritania</SelectItem>
                      <SelectItem value="MU">Mauritius</SelectItem>
                      <SelectItem value="YT">Mayotte</SelectItem>
                      <SelectItem value="MX">Mexico</SelectItem>
                      <SelectItem value="FM">Micronesia (Federated States of)</SelectItem>
                      <SelectItem value="MD">Moldova</SelectItem>
                      <SelectItem value="MC">Monaco</SelectItem>
                      <SelectItem value="MN">Mongolia</SelectItem>
                      <SelectItem value="ME">Montenegro</SelectItem>
                      <SelectItem value="MS">Montserrat</SelectItem>
                      <SelectItem value="MA">Morocco</SelectItem>
                      <SelectItem value="MZ">Mozambique</SelectItem>
                      <SelectItem value="MM">Myanmar</SelectItem>
                      <SelectItem value="NA">Namibia</SelectItem>
                      <SelectItem value="NR">Nauru</SelectItem>
                      <SelectItem value="NP">Nepal</SelectItem>
                      <SelectItem value="NL">Netherlands</SelectItem>
                      <SelectItem value="NC">New Caledonia</SelectItem>
                      <SelectItem value="NZ">New Zealand</SelectItem>
                      <SelectItem value="NI">Nicaragua</SelectItem>
                      <SelectItem value="NE">Niger</SelectItem>
                      <SelectItem value="NG">Nigeria</SelectItem>
                      <SelectItem value="NU">Niue</SelectItem>
                      <SelectItem value="NF">Norfolk Island</SelectItem>
                      <SelectItem value="MK">North Macedonia</SelectItem>
                      <SelectItem value="MP">Northern Mariana Islands</SelectItem>
                      <SelectItem value="NO">Norway</SelectItem>
                      <SelectItem value="OM">Oman</SelectItem>
                      <SelectItem value="PK">Pakistan</SelectItem>
                      <SelectItem value="PW">Palau</SelectItem>
                      <SelectItem value="PS">Palestine, State of</SelectItem>
                      <SelectItem value="PA">Panama</SelectItem>
                      <SelectItem value="PG">Papua New Guinea</SelectItem>
                      <SelectItem value="PY">Paraguay</SelectItem>
                      <SelectItem value="PE">Peru</SelectItem>
                      <SelectItem value="PH">Philippines</SelectItem>
                      <SelectItem value="PN">Pitcairn</SelectItem>
                      <SelectItem value="PL">Poland</SelectItem>
                      <SelectItem value="PT">Portugal</SelectItem>
                      <SelectItem value="PR">Puerto Rico</SelectItem>
                      <SelectItem value="QA">Qatar</SelectItem>
                      <SelectItem value="RE">Reunion</SelectItem>
                      <SelectItem value="RO">Romania</SelectItem>
                      <SelectItem value="RU">Russian Federation</SelectItem>
                      <SelectItem value="RW">Rwanda</SelectItem>
                      <SelectItem value="BL">Saint Barthelemy</SelectItem>
                      <SelectItem value="SH">Saint Helena, Ascension and Tristan da Cunha</SelectItem>
                      <SelectItem value="KN">Saint Kitts and Nevis</SelectItem>
                      <SelectItem value="LC">Saint Lucia</SelectItem>
                      <SelectItem value="MF">Saint Martin (French part)</SelectItem>
                      <SelectItem value="PM">Saint Pierre and Miquelon</SelectItem>
                      <SelectItem value="VC">Saint Vincent and the Grenadines</SelectItem>
                      <SelectItem value="WS">Samoa</SelectItem>
                      <SelectItem value="SM">San Marino</SelectItem>
                      <SelectItem value="ST">Sao Tome and Principe</SelectItem>
                      <SelectItem value="SA">Saudi Arabia</SelectItem>
                      <SelectItem value="SN">Senegal</SelectItem>
                      <SelectItem value="RS">Serbia</SelectItem>
                      <SelectItem value="SC">Seychelles</SelectItem>
                      <SelectItem value="SL">Sierra Leone</SelectItem>
                      <SelectItem value="SG">Singapore</SelectItem>
                      <SelectItem value="SX">Sint Maarten (Dutch part)</SelectItem>
                      <SelectItem value="SK">Slovakia</SelectItem>
                      <SelectItem value="SI">Slovenia</SelectItem>
                      <SelectItem value="SB">Solomon Islands</SelectItem>
                      <SelectItem value="SO">Somalia</SelectItem>
                      <SelectItem value="ZA">South Africa</SelectItem>
                      <SelectItem value="GS">South Georgia and the South Sandwich Islands</SelectItem>
                      <SelectItem value="SS">South Sudan</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                      <SelectItem value="LK">Sri Lanka</SelectItem>
                      <SelectItem value="SD">Sudan</SelectItem>
                      <SelectItem value="SR">Suriname</SelectItem>
                      <SelectItem value="SJ">Svalbard and Jan Mayen</SelectItem>
                      <SelectItem value="SE">Sweden</SelectItem>
                      <SelectItem value="CH">Switzerland</SelectItem>
                      <SelectItem value="SY">Syrian Arab Republic</SelectItem>
                      <SelectItem value="TW">Taiwan</SelectItem>
                      <SelectItem value="TJ">Tajikistan</SelectItem>
                      <SelectItem value="TZ">Tanzania</SelectItem>
                      <SelectItem value="TH">Thailand</SelectItem>
                      <SelectItem value="TL">Timor-Leste</SelectItem>
                      <SelectItem value="TG">Togo</SelectItem>
                      <SelectItem value="TK">Tokelau</SelectItem>
                      <SelectItem value="TO">Tonga</SelectItem>
                      <SelectItem value="TT">Trinidad and Tobago</SelectItem>
                      <SelectItem value="TN">Tunisia</SelectItem>
                      <SelectItem value="TR">Turkey</SelectItem>
                      <SelectItem value="TM">Turkmenistan</SelectItem>
                      <SelectItem value="TC">Turks and Caicos Islands</SelectItem>
                      <SelectItem value="TV">Tuvalu</SelectItem>
                      <SelectItem value="UG">Uganda</SelectItem>
                      <SelectItem value="UA">Ukraine</SelectItem>
                      <SelectItem value="AE">United Arab Emirates</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UM">United States Minor Outlying Islands</SelectItem>
                      <SelectItem value="UY">Uruguay</SelectItem>
                      <SelectItem value="UZ">Uzbekistan</SelectItem>
                      <SelectItem value="VU">Vanuatu</SelectItem>
                      <SelectItem value="VE">Venezuela</SelectItem>
                      <SelectItem value="VN">Viet Nam</SelectItem>
                      <SelectItem value="VG">Virgin Islands (British)</SelectItem>
                      <SelectItem value="VI">Virgin Islands (U.S.)</SelectItem>
                      <SelectItem value="WF">Wallis and Futuna</SelectItem>
                      <SelectItem value="EH">Western Sahara</SelectItem>
                      <SelectItem value="YE">Yemen</SelectItem>
                      <SelectItem value="ZM">Zambia</SelectItem>
                      <SelectItem value="ZW">Zimbabwe</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="country" value={country} />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    className="h-11 pr-10 pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Password strength:{' '}
                      <span className="font-medium">
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    className="h-11 pr-10 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pb-6">
              <SubmitButton />

              {/* Divider */}
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="border-border w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card text-muted-foreground px-2">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Login Link */}
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full border-[#8C52FF] text-[#8C52FF] transition-colors hover:bg-[#8C52FF] hover:text-white"
                onClick={() => {
                  const locale = window.location.pathname.split('/')[1] || 'en';
                  const currentReturnUrl = new URLSearchParams(
                    window.location.search
                  ).get('returnUrl');

                  // 1. If explicit returnUrl exists (e.g. from Bulk Order Sidebar), use it
                  if (currentReturnUrl) {
                    router.push(
                      `/${locale}/login?returnUrl=${encodeURIComponent(currentReturnUrl)}`
                    );
                    return;
                  }

                  // 2. If single pending order exists, redirect to processing
                  if (hasPendingOrder) {
                    router.push(
                      `/${locale}/login?returnUrl=` +
                      encodeURIComponent('/dashboard/processing')
                    );
                  } else {
                    router.push(`/${locale}/login`);
                  }
                }}
              >
                Login Now
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-muted-foreground text-center text-xs">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
        <p className="text-muted-foreground text-center text-sm">
          © 2025 WebblyHosting. All rights reserved.
        </p>
      </div>
    </div>
  );
}
