import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Recipes from './pages/Recipes';
import Cart from './pages/Cart';
import './App.css';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Recipes />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </>
  );
}
