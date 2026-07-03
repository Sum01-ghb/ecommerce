CREATE INDEX "product_images_product_id_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_images_variant_id_idx" ON "product_images" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "product_variants_color_product_idx" ON "product_variants" USING btree ("color_id","product_id");--> statement-breakpoint
CREATE INDEX "product_variants_size_product_idx" ON "product_variants" USING btree ("size_id","product_id");--> statement-breakpoint
CREATE INDEX "product_variants_price_idx" ON "product_variants" USING btree ("price");--> statement-breakpoint
CREATE INDEX "products_brand_published_idx" ON "products" USING btree ("brand_id","is_published");--> statement-breakpoint
CREATE INDEX "products_category_published_idx" ON "products" USING btree ("category_id","is_published");--> statement-breakpoint
CREATE INDEX "products_gender_published_idx" ON "products" USING btree ("gender_id","is_published");--> statement-breakpoint
CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");