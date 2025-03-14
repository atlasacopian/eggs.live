const CurrentPrice = ({ price }: { price: number }) => {
  return (
    <div className="text-center p-4 bg-amber-50 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-700 mb-1">Current Price</h2>
      <p className="text-3xl font-bold text-amber-600">${price.toFixed(2)}</p>
      <p className="text-sm text-gray-500 mt-1">per dozen</p>
    </div>
  )
}

export default CurrentPrice

