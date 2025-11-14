import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const productId = formData.get('productId') as string;
    const colorName = formData.get('colorName') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!productId || !colorName) {
      return NextResponse.json(
        { error: 'Product ID and color name are required' },
        { status: 400 }
      );
    }

    // Clean color name for folder (remove spaces, special chars)
    const cleanColorName = colorName.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Create upload directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products', productId, cleanColorName);

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedPaths: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        continue; // Skip invalid files
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}-${i}-${originalName}`;

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save file
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);

      // Store relative path for database
      const relativePath = `/uploads/products/${productId}/${cleanColorName}/${filename}`;
      uploadedPaths.push(relativePath);
    }

    return NextResponse.json({
      success: true,
      paths: uploadedPaths,
      message: `${uploadedPaths.length} files uploaded successfully`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// Configure for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};