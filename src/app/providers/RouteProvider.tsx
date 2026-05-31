import { RouterProvider } from 'react-router'
import { router } from '../routes/router'

export function RouteProvider() {
  return <RouterProvider router={router} />
}
