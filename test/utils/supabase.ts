import { type Mock, vi } from "vitest"

type QueryResponse<TData> = {
  data: TData
  error: unknown
}

type QueryBuilder<TData> = {
  select: Mock
  eq: Mock
  order: Mock
  gte: Mock
  limit: Mock
  then: Promise<QueryResponse<TData>>["then"]
  catch: Promise<QueryResponse<TData>>["catch"]
}

const createQueryBuilder = <TData>(
  response: QueryResponse<TData>
): QueryBuilder<TData> => {
  const promise = Promise.resolve(response)

  const builder: QueryBuilder<TData> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    // biome-ignore lint/suspicious/noThenProperty: intentional to make mock builder thenable for testing
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  }

  return builder
}

interface SupabaseMockAuthOptions {
  user?: { id: string } | null
  error?: unknown
}

interface SupabaseMockOptions<
  TMatches = unknown,
  TAssessments = unknown,
  TRecentMatches = unknown,
> {
  auth?: SupabaseMockAuthOptions
  matches?: QueryResponse<TMatches>
  assessments?: QueryResponse<TAssessments>
  recentMatches?: QueryResponse<TRecentMatches>
}

export const createSupabaseClientMock = <
  TMatches = unknown,
  TAssessments = unknown,
  TRecentMatches = unknown,
>({
  auth = { user: { id: "user-1" }, error: null },
  matches = { data: [] as TMatches, error: null },
  assessments = { data: [] as TAssessments, error: null },
  recentMatches = { data: [] as TRecentMatches, error: null },
}: SupabaseMockOptions<TMatches, TAssessments, TRecentMatches> = {}) => {
  let matchesCallCount = 0

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: auth.user ?? null },
        error: auth.error ?? null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "matches") {
        matchesCallCount += 1
        return matchesCallCount === 1
          ? createQueryBuilder(matches)
          : createQueryBuilder(recentMatches)
      }

      if (table === "match_assessments") {
        return createQueryBuilder(assessments)
      }

      return createQueryBuilder({ data: [], error: null })
    }),
  }
}
