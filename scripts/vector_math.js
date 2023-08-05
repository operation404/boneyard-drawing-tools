export class Vector_Math {
	// all operations are done in place on first vector parameter when possible
	// they also return a reference to the array that the operation was done on

	static scale(v, s) {
		for (let i = 0; i < v.length; i++) {
			v[i] *= s;
		}
		return v;
	}

	static add(v1, v2) {
		if (v1.length !== v2.length) throw 'Vectors are not same length.';

		for (let i = 0; i < v1.length; i++) {
			v1[i] += v2[i];
		}
		return v1;
	}

	static subtract(v1, v2) {
		if (v1.length !== v2.length) throw 'Vectors are not same length.';

		for (let i = 0; i < v1.length; i++) {
			v1[i] -= v2[i];
		}
		return v1;
	}

	static dot_product(v1, v2) {
		if (v1.length !== v2.length) throw 'Vectors are not same length.';

		let sum = 0;
		for (let i = 0; i < v1.length; i++) {
			sum += v1[i] * v2[i];
		}
		return sum;
	}

	// returns new vector, does not modify v1 or v2
	static cross_product(v1, v2) {
		if (v1.length !== 3 || v2.length !== 3) throw 'Vectors must have length of 3.';

		return [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]];
	}

	// all parameters are 3d points that make up a plane, given in clockwise order
	// A should be hue point, B should always be black, and C should always be white
	static planar_normal(A, B, C) {
		const v1 = Vector_Math.subtract([...A], B);
		const v2 = Vector_Math.subtract([...C], B);
		return Vector_Math.cross_product(v1, v2);
	}

	// ABC make up a 3d plane and must be given in clockwise order
	// returns a postiive value if X is on the side the plane's normal points to, 0 if on the plane, negative otherwise
	// X is treated as a vector from the origin to the point X for the purpose of the dot product
	static point_plane_orientation(A, B, C, X) {
		const normal = Vector_Math.planar_normal(A, B, C);
		return Vector_Math.dot_product(normal, X);
	}

	/*
    // All parameters must be 3-points, with ABC determining the plane and X.
    // All points are arrays in xyz order. The points making up the top side of the plane should be in clockwise order.
    // Positive result means X is on the same side as the plane's normal, negative is opposite, 0 is on the plane.
    static point_plane_orientation(A, B, C, X) {
        const BA = [B[0]-A[0], B[1]-A[1], B[2]-A[2]]; // a d g
        const CA = [C[0]-A[0], C[1]-A[1], C[2]-A[2]]; // b e h
        const XA = [X[0]-A[0], X[1]-A[1], X[2]-A[2]]; // c f i
        const determinant = (BA[0] * CA[1] * XA[2]) +
                            (CA[0] * XA[2] * BA[2]) +
                            (XA[0] * BA[1] * CA[2]) -
                            (XA[0] * CA[1] * BA[2]) -
                            (CA[0] * BA[1] * XA[2]) -
                            (BA[0] * XA[1] * CA[2]);
        return -1 * determinant;
    }
    */
}
