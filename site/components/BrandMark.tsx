import { assetUrl } from "../lib/images";
export default function BrandMark() {
  return <img className="brand-mark" src={assetUrl("/metaflow-logo.svg")} width={27} height={24} alt="" aria-hidden="true" />;
}
