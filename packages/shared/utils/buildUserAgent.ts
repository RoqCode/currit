export default function buildUserAgent() {
  const appName = "Currit";
  const version = "0.1"; // can we get that dynamically?
  const contactLink = "https://hajohaas.de/currit";

  return `${appName}/${version} (+${contactLink})`;
}
