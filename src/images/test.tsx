import {Button} from "@/components/button";

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {products.map((product) => (
        <div key={product._id} className="card flex flex-col">
            {product.image && (
                <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
            )}
            <h3 className="text-xl font-bold mb-2">{product.name}</h3>
            <p className="text-muted mb-4 flex-grow">{product.description}</p>

            <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-muted-foreground">${product.price.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
            </div>

            <Button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0 || (items.find(item => item.product_id === product._id)?.quantity || 0) >= product.stock}
                variant="primary"
                className="w-full"
            >
                {product.stock === 0 ? "Agotado" : (items.find(item => item.product_id === product._id)?.quantity || 0) >= product.stock ? "Máximo alcanzado" : "Agregar al Carrito"}
            </Button>
        </div>
    ))}
</div>