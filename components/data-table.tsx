// Copyright@ filynai.com
// Author: Bin Lee
// Email: blee@filynai.com
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function DataTable() {
  const data = [
    {
      typeOfStudy: "Absorption",
      testSystem: "",
      methodOfAdministration: "",
      testingFacility: "",
      studyNumber: "(2)",
      locationVolSection: "(3)",
    },
    {
      typeOfStudy: "Distribution",
      testSystem: "Rat, Rabbit",
      methodOfAdministration: "IV, Oral",
      testingFacility: "DEF Clinical Labs",
      studyNumber: "DIS-2023-07",
      locationVolSection: "Vol 2, Sec 4.1",
    },
    {
      typeOfStudy: "Metabolism",
      testSystem: "Rat, Mouse",
      methodOfAdministration: "Oral, IV",
      testingFacility: "ABC Research",
      studyNumber: "MET-2023-01",
      locationVolSection: "Vol 3, Sec 4.2",
    },
  ]

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-card">
            <TableHead className="font-semibold text-foreground px-4 text-center">Type of Study</TableHead>
            <TableHead className="font-semibold text-foreground px-4 text-center">Test System</TableHead>
            <TableHead className="font-semibold text-foreground px-4 text-center">Method of Administration</TableHead>
            <TableHead className="font-semibold text-foreground px-4 text-center">Testing Facility</TableHead>
            <TableHead className="font-semibold text-foreground px-4 text-center">Study Number</TableHead>
            <TableHead className="font-semibold text-foreground px-4 text-center">Location Vol, Section</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} className={index % 2 === 0 ? "bg-background" : "bg-card/50"}>
              <TableCell className="font-medium px-4 py-3 text-center">{row.typeOfStudy}</TableCell>
              <TableCell className="px-4 py-3 text-center">{row.testSystem}</TableCell>
              <TableCell className="px-4 py-3 text-center">{row.methodOfAdministration}</TableCell>
              <TableCell className="px-4 py-3 text-center">{row.testingFacility}</TableCell>
              <TableCell className="px-4 py-3 text-center">{row.studyNumber}</TableCell>
              <TableCell className="px-4 py-3 text-center">{row.locationVolSection}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
