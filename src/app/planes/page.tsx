import PlanesClient from './PlanesClient'

export default function PlanesPage() {
  return <PlanesClient mpPublicKey={process.env.MP_PUBLIC_KEY_PROD ?? ''} />
}
