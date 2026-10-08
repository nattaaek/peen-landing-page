export function seasonalSpotlightState(hasData: boolean, isLoading: boolean, isError: boolean) {
  if (isError) return 'error'
  if (isLoading) return 'loading'
  return hasData ? 'ready' : 'empty'
}
