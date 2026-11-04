import { handleMissingAsset, type AssetFetcher } from './notFound'

interface Env {
  ASSETS: AssetFetcher
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handleMissingAsset(request, env.ASSETS)
  },
}
