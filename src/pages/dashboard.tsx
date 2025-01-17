import React, { useEffect, useState } from "react";
import { Product, ProductsResponse } from "../types";
import { useLoaderData, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { convertToRupee, formatPercentage, formatPrice, sortProductsByPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Reviews from "@/components/ui/reviews";
import { ShoppingCart } from "lucide-react";
import Filters from "@/components/ui/filter";
import { addToCart } from "@/features/cartSlice";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useDispatch } from "react-redux";
import { toast, Toaster } from 'react-hot-toast'; 


function processResponse(data: ProductsResponse) {
  return {
    ...data,
    products: data.products.map((product) => ({ ...product, price: convertToRupee(product.price) })),
  };
}

const defaultLimit = 15;
export function loader({ request }: { request: any }) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const page = url.searchParams.get("page");
  const skip = page ? defaultLimit * (parseInt(page) - 1) : 0;

  if (search) {
    return fetch(`https://dummyjson.com/products/search?q=${search}`)
      .then((res) => res.json())
      .then(processResponse);
  }
  if (category && category !== "all") {
    return fetch(`https://dummyjson.com/products/category/${category}?limit=${defaultLimit}&skip=${skip}`)
      .then((res) => res.json())
      .then(processResponse);
  }
  return fetch(`https://dummyjson.com/products?limit=${defaultLimit}&skip=${skip}`)
    .then((res) => res.json())
    .then(processResponse);
}

export default function Dashboard() {
  const { products, total, skip } = useLoaderData() as ProductsResponse;
  const dispatch = useDispatch();
  const numberOfPages = Math.round(total / defaultLimit);
  const pageNumber = Math.ceil(skip / defaultLimit) + 1;
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [sortBy, setSortBy] = useState("");

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const sortedProducts = sortProductsByPrice(products);

  function onSortingChanged(value: string) {
    if (value === "low") {
      setSortBy("asc");
      setFilteredProducts(sortProductsByPrice(filteredProducts,"asc"));
    } else if (value === "high") {
      setSortBy("desc");
      setFilteredProducts(sortProductsByPrice(filteredProducts, "desc"));
    } else {
      setSortBy("");
      setFilteredProducts(products);
    }
  }
  function onPriceChange([minPrice, maxPrice]: number[]) {
    console.log({ minPrice, maxPrice });
    const filteredItems = products.filter((product) => product.price >= minPrice && product.price <= maxPrice);
    if (sortBy) {
      setFilteredProducts(sortProductsByPrice(filteredItems, sortBy as "asc" | "desc"));
    } else {
      setFilteredProducts(filteredItems);
    }
  }

  function onPageChange(pageNumber: number, event: React.MouseEvent) {
    event.preventDefault();
    console.log({ pageNumber, searchParams, value: searchParams.toString() });
    const urlSearchParams = new URLSearchParams(searchParams);
    urlSearchParams.set("page", pageNumber.toString());
    setSearchParams(urlSearchParams);
  }

  function addProductToCart(product: any) {
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Product added to cart successfully !', {
      duration: 2000,
      position: 'bottom-right',
    });
  }

  function buildPagination() {
    const pages = [];
    for (let index = pageNumber > 4 ? pageNumber - 2 : 1; index <= pageNumber + 2 && index <= numberOfPages; index++) {
      pages.push(
        <PaginationItem key={index}>
          <PaginationLink className={`mx-1 px-3 py-1 rounded-md ${pageNumber === index ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={(event) => onPageChange(index, event)} href="#">
            {index}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return pages;
  }

  function showProduct(productId: number) {
    navigate(`/product/${productId}`);
  }

  return (
    <section className="px-10 flex flex-col gap-4 py-6 bg-gray-50 rounded-lg shadow-md">
      <header className="flex items-center justify-end">
        <Filters
          minPrice={sortedProducts.at(0)?.price}
          maxPrice={sortedProducts.at(-1)?.price}
          onPriceChange={onPriceChange}
          onSortingChanged={onSortingChanged}
        />
      </header>
      <section className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
        <Toaster />
        {filteredProducts.map(
          ({ title, description, id, thumbnail, price, discountPercentage, tags, reviews, images }) => {
            return (
              <Card key={id} className="flex flex-col cursor-pointer hover:scale-105 shadow-lg rounded-lg" onClick={() => showProduct(id)}>
                <CardHeader className="-m-6">
                  <img className="rounded-t-xl object-contain aspect-square" src={thumbnail} alt={title} />
                </CardHeader>
                <CardContent className="flex flex-col gap-2 mt-4">
                  <article className="flex items-center gap-2">
                    <p className="relative">
                      <span className="absolute text-xs font-semibold left-0 top-1/2 -translate-y-1/2">₹</span>
                      <span className="ml-2 text-xl font-bold">{formatPrice(price)}</span>
                    </p>
                    {discountPercentage > 1 ? (
                      <Badge className="text-green-600 text-xl" variant={"outline"}>
                        {formatPercentage(discountPercentage)}% off
                      </Badge>
                    ) : null}
                  </article>
                  <CardTitle className="line-clamp-1 text-lg font-semibold text-gray-800">{title}</CardTitle>
                  <CardDescription className="line-clamp-1 text-sm text-gray-600">{description}</CardDescription>
                  <HoverCard>
                    <HoverCardTrigger className="underline font-bold">View More</HoverCardTrigger>
                    <HoverCardContent className="p-4 bg-white shadow-lg rounded-lg">
                      <article className="flex flex-col gap-2">
                        <h1 className="font-semibold">{title}</h1>
                        <p className="text-sm">{description}</p>
                        <section className="flex gap-2 items-center">
                          {tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </section>
                        <Reviews reviews={reviews} />
                      </article>
                    </HoverCardContent>
                  </HoverCard>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 transition duration-200"
                    onClick={() =>
                      addProductToCart({
                        title,
                        description,
                        id,
                        thumbnail,
                        price,
                        discountPercentage,
                        tags,
                        reviews,
                        images,
                      })
                    }
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
                  </Button>
                </CardFooter>
              </Card>
            );
          }
        )}
      </section>
      <Pagination>
        <PaginationContent>
          {pageNumber > 1 ? (
            <PaginationItem>
              <PaginationPrevious onClick={(event) => onPageChange(pageNumber - 1, event)} href="#" />
            </PaginationItem>
          ) : null}

          {buildPagination()}
          {pageNumber + 2 < numberOfPages ? (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          ) : null}

          {pageNumber < numberOfPages ? (
            <PaginationItem>
              <PaginationNext onClick={(event) => onPageChange(pageNumber + 1, event)} href="#" />
            </PaginationItem>
          ) : null}
        </PaginationContent>
      </Pagination>
    </section>
  );
}