import { createBrowserClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import {
  createProjectFolderStructure,
  fetchCurrentAuthenticatedUserId,
  fetchProjectRows,
} from "../projects.repository";

jest.mock("@/lib/supabase", () => ({
  createBrowserClient: jest.fn(),
}));

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(),
}));

const mockedCreateBrowserClient = createBrowserClient as jest.MockedFunction<
  typeof createBrowserClient
>;
const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("lib/projects/projects.repository", () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    mockedCreateBrowserClient.mockReset();
  });

  it("posts new project folder request", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    });

    await createProjectFolderStructure({
      tenantName: "filynai.com",
      projectName: "Lpathomab IND",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/s3/new-project",
      expect.objectContaining({ method: "POST" }),
    );

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({
      tenant_name: "filynai.com",
      project_name: "Lpathomab IND",
    });
  });

  it("throws parsed error when folder API fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ error: "Folder failed" }),
    });

    await expect(
      createProjectFolderStructure({
        tenantName: "filynai.com",
        projectName: "Lpathomab IND",
      }),
    ).rejects.toThrow("Folder failed");
  });

  it("fetches project rows with id filter", async () => {
    const inMock = jest.fn().mockResolvedValue({
      data: [{ id: "p1" }],
      error: null,
    });

    mockedCreateClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            in: inMock,
          }),
        }),
      }),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createClient>);

    const rows = await fetchProjectRows({ projectIds: ["p1"] });

    expect(inMock).toHaveBeenCalledWith("id", ["p1"]);
    expect(rows).toEqual([{ id: "p1" }]);
  });

  it("fetches current authenticated user id", async () => {
    mockedCreateClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createClient>);

    await expect(fetchCurrentAuthenticatedUserId()).resolves.toBe("user-1");
  });
});
