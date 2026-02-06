-- Allow recipe creators to delete any comment on their recipes
CREATE POLICY "Recipe owners can delete comments on their recipes"
  ON comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = comments.recipe_id
        AND recipes.user_id = auth.uid()
    )
  );
