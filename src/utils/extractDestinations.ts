function extractDestinations(text: string, t: (key: string) => string) {
  const regex = /data-destination='([^']+)'/g;
  const destinations = [];
  let match;
  const translatedText = t(text);
  while ((match = regex.exec(translatedText)) !== null) {
    destinations.push(match[1]);
  }
  return destinations;
}

export default extractDestinations;
