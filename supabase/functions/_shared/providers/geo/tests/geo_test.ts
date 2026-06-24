// Google geo parsers: pure normalization of Places/Details/TimeZone responses.

import { assert, assertEquals, assertThrows } from "../../../test_util.ts";
import {
  parseAutocomplete,
  parsePlaceDetails,
  parseTimezone,
  timestampForDate,
} from "../index.ts";

Deno.test("autocomplete keeps only predictions with id + description", () => {
  const r = parseAutocomplete({
    status: "OK",
    predictions: [
      { place_id: "p1", description: "Portland, OR, USA" },
      { description: "missing id" },
    ],
  });
  assertEquals(r.length, 1);
  assertEquals(r[0], { id: "p1", label: "Portland, OR, USA" });
});

Deno.test("autocomplete ZERO_RESULTS is empty, not an error", () => {
  assertEquals(parseAutocomplete({ status: "ZERO_RESULTS", predictions: [] }).length, 0);
});

Deno.test("autocomplete bad status throws", () => {
  assertThrows(() => parseAutocomplete({ status: "REQUEST_DENIED" }));
});

Deno.test("place details extracts geometry, requires it", () => {
  const d = parsePlaceDetails({
    status: "OK",
    result: { geometry: { location: { lat: 45.52, lng: -122.68 } }, formatted_address: "Portland, OR" },
  });
  assertEquals(d.lat, 45.52);
  assertEquals(d.lng, -122.68);
  assertEquals(d.label, "Portland, OR");
  assertThrows(() => parsePlaceDetails({ status: "OK", result: {} }));
});

Deno.test("timezone sums raw + dst offset (DST-correct)", () => {
  const t = parseTimezone({
    status: "OK",
    timeZoneId: "America/Los_Angeles",
    rawOffset: -28800,
    dstOffset: 3600,
  });
  assertEquals(t.timezone, "America/Los_Angeles");
  assertEquals(t.utcOffsetSeconds, -25200);
  assertThrows(() => parseTimezone({ status: "ZERO_RESULTS" }));
});

Deno.test("timestampForDate is noon UTC of that date", () => {
  assertEquals(timestampForDate("2000-01-01"), Math.floor(Date.UTC(2000, 0, 1, 12, 0, 0) / 1000));
});
