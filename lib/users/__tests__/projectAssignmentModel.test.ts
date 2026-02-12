import { diffProjectAssignments } from "../projectAssignmentModel";

describe("lib/users/projectAssignmentModel", () => {
  it("calculates add/remove assignment deltas", () => {
    const diff = diffProjectAssignments({
      currentProjectIds: ["p1", "p2", "p3"],
      selectedProjectIds: ["p2", "p4"],
    });

    expect(diff.toAdd).toEqual(["p4"]);
    expect(diff.toRemove).toEqual(["p1", "p3"]);
  });

  it("returns empty deltas when unchanged", () => {
    const diff = diffProjectAssignments({
      currentProjectIds: ["p1", "p2"],
      selectedProjectIds: ["p1", "p2"],
    });

    expect(diff).toEqual({
      toAdd: [],
      toRemove: [],
    });
  });
});
