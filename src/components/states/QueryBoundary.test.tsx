import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { ApiError } from '@/api/errors'
import { QueryBoundary } from './QueryBoundary'

function Harness({ fn, isEmpty }: { fn: () => Promise<string[]>; isEmpty?: (d: string[]) => boolean }) {
  const query = useQuery({ queryKey: ['t'], queryFn: fn, retry: false })
  return (
    <QueryBoundary query={query} skeleton={<p>skeleton</p>} isEmpty={isEmpty} empty={<p>empty</p>}>
      {(data) => <p>data:{data.join(',')}</p>}
    </QueryBoundary>
  )
}

const renderWith = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>)

const apiError = (code: ApiError['code'], status: number) =>
  new ApiError({ status, code, message: code, retryable: false, requestId: 'req_9' })

describe('QueryBoundary', () => {
  it('renders data', async () => {
    renderWith(<Harness fn={async () => ['a', 'b']} />)
    expect(await screen.findByText('data:a,b')).toBeInTheDocument()
  })

  it('renders the empty state', async () => {
    renderWith(<Harness fn={async () => []} isEmpty={(d) => d.length === 0} />)
    expect(await screen.findByText('empty')).toBeInTheDocument()
  })

  it('renders error with retry and request id', async () => {
    renderWith(<Harness fn={() => Promise.reject(apiError('INTERNAL', 500))} />)
    expect(await screen.findByText("We couldn't load this")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByText('req_9')).toBeInTheDocument()
  })

  it('renders the permission state on PERMISSION_DENIED', async () => {
    renderWith(<Harness fn={() => Promise.reject(apiError('PERMISSION_DENIED', 403))} />)
    expect(await screen.findAllByText('No permission')).not.toHaveLength(0)
  })

  it('shows the skeleton only after the delay', async () => {
    renderWith(<Harness fn={() => new Promise(() => {})} />)
    expect(screen.queryByText('skeleton')).not.toBeInTheDocument()
    expect(await screen.findByText('skeleton', {}, { timeout: 1000 })).toBeInTheDocument()
  })
})
