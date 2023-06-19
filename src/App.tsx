import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route
} from "react-router-dom";
import NameGame from './pages/NameGame'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import './App.css'
import Header from './components/Header';

function App() {
  const queryClient = new QueryClient();


  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<NameGame />} >
        <Route index element={<NameGame />} />
      </Route>
    )

  )

  return (
      <QueryClientProvider client={queryClient}>
        <div className='app app-body min-w-max font-FinkHeavy'>
          <Header />
        <RouterProvider router={router}/>
        </div>
        
      </QueryClientProvider>
    )
}

export default App
