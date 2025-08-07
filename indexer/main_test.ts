import { assertEquals } from "@std/assert";
import { parseMembers } from "./main.ts";

Deno.test("parseMembers should correctly parse member data", () => {
  const memberData = [
    "0x1234567890123456789012345678901234567890123456789012345678901234",
    "50",
    "0x2345678901234567890123456789012345678901234567890123456789012345",
    "30",
    "0x3456789012345678901234567890123456789012345678901234567890123456",
    "20",
  ];

  const expected = [
    {
      addr: "0x1234567890123456789012345678901234567890123456789012345678901234",
      percentage: 50,
    },
    {
      addr: "0x2345678901234567890123456789012345678901234567890123456789012345",
      percentage: 30,
    },
    {
      addr: "0x3456789012345678901234567890123456789012345678901234567890123456",
      percentage: 20,
    },
  ];

  const result = parseMembers(memberData);
  assertEquals(result, expected);
});

Deno.test("parseMembers should handle empty array", () => {
  const memberData: string[] = [];
  const result = parseMembers(memberData);
  assertEquals(result, []);
});

Deno.test("parseMembers should handle odd number of elements", () => {
  const memberData = [
    "0x1234567890123456789012345678901234567890123456789012345678901234",
    "50",
    "0x2345678901234567890123456789012345678901234567890123456789012345",
    // Missing percentage for second member
  ];

  const expected = [
    {
      addr: "0x1234567890123456789012345678901234567890123456789012345678901234",
      percentage: 50,
    },
  ];

  const result = parseMembers(memberData);
  assertEquals(result, expected);
}); 