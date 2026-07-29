import CurvedInput from './CurvedInput'
<CurvedInput
  placeholder="david@reactbits.dev"
  buttonText="Get Started"
  theme="dark"
  bend={28}
  height={64}
  width={450}
  onSubmit={value => console.log(value)}
/>
// Light preset, flat, no button
<CurvedInput
  theme="light"
  bend={0}
  showButton={false}
  showIcon={false}
  placeholder="Search components..."
  type="text"
/>