export interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export const parseGoogleAddress = (
  addressComponents: google.maps.GeocoderAddressComponent[],
  fallbackAddressName?: string
): ParsedAddress => {
  let address = "";
  let route = "";
  let streetNumber = "";
  let city = "";
  let state = "";
  let postcode = "";
  let country = "";

  addressComponents.forEach((component) => {
    const types = component.types;

    if (types.includes("street_number")) {
      streetNumber = component.long_name;
    }
    if (types.includes("route")) {
      route = component.long_name;
    }
    if (types.includes("locality")) {
      city = component.long_name;
    } else if (types.includes("postal_town") && !city) {
      city = component.long_name;
    }
    
    if (types.includes("administrative_area_level_1")) {
      state = component.long_name;
    }
    if (types.includes("postal_code")) {
      postcode = component.long_name;
    }
    if (types.includes("country")) {
      country = component.long_name;
    }
  });

  if (streetNumber || route) {
    address = `${streetNumber} ${route}`.trim();
  } else if (fallbackAddressName) {
    address = fallbackAddressName;
  }

  return {
    address,
    city,
    state,
    postcode,
    country,
  };
};
