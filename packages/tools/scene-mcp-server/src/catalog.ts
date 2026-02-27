/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Catalog of Babylon.js scene primitives, camera types, light types,
 * and material presets. Used by the MCP server to expose reference data
 * and validate tool parameters.
 */

// ═══════════════════════════════════════════════════════════════════════════
//  Mesh primitives
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface IMeshPrimitiveInfo {
    /** Human-readable description */
    description: string;
    /** Available creation options with their types and defaults */
    options: Record<
        string,
        {
            type: string;
            default?: unknown;
            description: string;
        }
    >;
}

export const MeshPrimitives: Record<string, IMeshPrimitiveInfo> = {
    Box: {
        description: "A cuboid mesh. Default is a unit cube centered at the origin.",
        options: {
            size: { type: "number", default: 1, description: "Size of each side (overridden by width/height/depth)" },
            width: { type: "number", description: "Width (x-axis)" },
            height: { type: "number", description: "Height (y-axis)" },
            depth: { type: "number", description: "Depth (z-axis)" },
            faceColors: { type: "Color4[]", description: "Array of 6 Color4 values for each face" },
        },
    },
    Sphere: {
        description: "A sphere mesh. Default is a unit sphere centered at the origin.",
        options: {
            diameter: { type: "number", default: 1, description: "Diameter of the sphere" },
            diameterX: { type: "number", description: "Diameter on X axis (ellipsoid)" },
            diameterY: { type: "number", description: "Diameter on Y axis (ellipsoid)" },
            diameterZ: { type: "number", description: "Diameter on Z axis (ellipsoid)" },
            segments: { type: "number", default: 32, description: "Number of horizontal segments" },
            arc: { type: "number", default: 1, description: "Ratio of circumference (0 to 1)" },
            slice: { type: "number", default: 1, description: "Ratio of height (0 to 1)" },
        },
    },
    Cylinder: {
        description: "A cylinder or cone mesh.",
        options: {
            height: { type: "number", default: 2, description: "Height of the cylinder" },
            diameter: { type: "number", default: 1, description: "Diameter of both top and bottom" },
            diameterTop: { type: "number", description: "Top diameter (0 for cone)" },
            diameterBottom: { type: "number", description: "Bottom diameter" },
            tessellation: { type: "number", default: 24, description: "Number of sides" },
            arc: { type: "number", default: 1, description: "Ratio of circumference (0 to 1)" },
        },
    },
    Plane: {
        description: "A flat plane mesh.",
        options: {
            size: { type: "number", default: 1, description: "Size of the plane" },
            width: { type: "number", description: "Width" },
            height: { type: "number", description: "Height" },
            sideOrientation: { type: "number", default: 0, description: "0=FrontSide, 1=BackSide, 2=DoubleSide" },
        },
    },
    Ground: {
        description: "A flat ground mesh in the XZ plane.",
        options: {
            width: { type: "number", default: 1, description: "Width (X)" },
            height: { type: "number", default: 1, description: "Depth (Z)" },
            subdivisions: { type: "number", default: 1, description: "Number of subdivisions" },
        },
    },
    Torus: {
        description: "A torus (donut) mesh.",
        options: {
            diameter: { type: "number", default: 1, description: "Outer diameter" },
            thickness: { type: "number", default: 0.5, description: "Tube thickness" },
            tessellation: { type: "number", default: 16, description: "Number of segments" },
        },
    },
    TorusKnot: {
        description: "A torus knot mesh.",
        options: {
            radius: { type: "number", default: 2, description: "Radius" },
            tube: { type: "number", default: 0.5, description: "Tube thickness" },
            radialSegments: { type: "number", default: 32, description: "Number of radial segments" },
            tubularSegments: { type: "number", default: 32, description: "Number of tubular segments" },
            p: { type: "number", default: 2, description: "Winding number p" },
            q: { type: "number", default: 3, description: "Winding number q" },
        },
    },
    Disc: {
        description: "A flat disc (circle) mesh.",
        options: {
            radius: { type: "number", default: 0.5, description: "Radius" },
            tessellation: { type: "number", default: 64, description: "Number of sides" },
            arc: { type: "number", default: 1, description: "Ratio of circumference" },
        },
    },
    Capsule: {
        description: "A capsule (cylinder with hemispherical caps) mesh.",
        options: {
            height: { type: "number", default: 2, description: "Total height including caps" },
            radius: { type: "number", default: 0.25, description: "Radius of the capsule" },
            tessellation: { type: "number", default: 16, description: "Number of segments" },
            subdivisions: { type: "number", default: 6, description: "Cap subdivisions" },
        },
    },
    IcoSphere: {
        description: "A sphere based on icosahedron subdivision, more uniform triangles.",
        options: {
            radius: { type: "number", default: 1, description: "Radius" },
            subdivisions: { type: "number", default: 4, description: "Subdivision level" },
            flat: { type: "boolean", default: true, description: "Whether to use flat shading" },
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Camera types
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface ICameraTypeInfo {
    /** Human-readable description */
    description: string;
    /** Babylon.js class name */
    className: string;
    /** Available creation options with their types and defaults */
    options: Record<
        string,
        {
            type: string;
            default?: unknown;
            description: string;
        }
    >;
}

export const CameraTypes: Record<string, ICameraTypeInfo> = {
    ArcRotateCamera: {
        description: "An orbital camera that rotates around a target point. Best for inspecting objects.",
        className: "ArcRotateCamera",
        options: {
            alpha: { type: "number", default: -Math.PI / 2, description: "Horizontal rotation angle (radians)" },
            beta: { type: "number", default: Math.PI / 2, description: "Vertical rotation angle (radians)" },
            radius: { type: "number", default: 10, description: "Distance from target" },
            target: { type: "Vector3", default: [0, 0, 0], description: "Point to orbit around" },
            lowerRadiusLimit: { type: "number", description: "Minimum zoom distance" },
            upperRadiusLimit: { type: "number", description: "Maximum zoom distance" },
            lowerBetaLimit: { type: "number", description: "Minimum vertical angle" },
            upperBetaLimit: { type: "number", description: "Maximum vertical angle" },
            wheelPrecision: { type: "number", default: 50, description: "Scroll zoom sensitivity" },
            attachControl: { type: "boolean", default: true, description: "Whether to attach to canvas for user input" },
        },
    },
    FreeCamera: {
        description: "A first-person camera with WASD/arrow key movement. Good for walkthroughs.",
        className: "FreeCamera",
        options: {
            position: { type: "Vector3", default: [0, 5, -10], description: "Camera position" },
            target: { type: "Vector3", default: [0, 0, 0], description: "Point to look at" },
            speed: { type: "number", default: 2, description: "Movement speed" },
            attachControl: { type: "boolean", default: true, description: "Whether to attach to canvas" },
        },
    },
    UniversalCamera: {
        description: "An enhanced FreeCamera with gamepad support. The default camera type.",
        className: "UniversalCamera",
        options: {
            position: { type: "Vector3", default: [0, 5, -10], description: "Camera position" },
            target: { type: "Vector3", default: [0, 0, 0], description: "Point to look at" },
            speed: { type: "number", default: 2, description: "Movement speed" },
            attachControl: { type: "boolean", default: true, description: "Whether to attach to canvas" },
        },
    },
    FollowCamera: {
        description: "A camera that follows a target mesh from behind. Good for third-person views.",
        className: "FollowCamera",
        options: {
            position: { type: "Vector3", default: [0, 5, -10], description: "Initial camera position" },
            radius: { type: "number", default: 30, description: "Distance from target" },
            heightOffset: { type: "number", default: 10, description: "Height above target" },
            rotationOffset: { type: "number", default: 0, description: "Angle offset from behind (degrees)" },
            cameraAcceleration: { type: "number", default: 0.05, description: "Smoothing for camera movement" },
            maxCameraSpeed: { type: "number", default: 20, description: "Max camera speed" },
            lockedTarget: { type: "string", description: "Name of the mesh to follow" },
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Light types
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface ILightTypeInfo {
    /** Human-readable description */
    description: string;
    /** Babylon.js class name */
    className: string;
    /** Available creation options with their types and defaults */
    options: Record<
        string,
        {
            type: string;
            default?: unknown;
            description: string;
        }
    >;
}

export const LightTypes: Record<string, ILightTypeInfo> = {
    HemisphericLight: {
        description: "Ambient-like light that illuminates from a direction with a ground color. Good for outdoor scenes.",
        className: "HemisphericLight",
        options: {
            direction: { type: "Vector3", default: [0, 1, 0], description: "Direction the light shines FROM" },
            intensity: { type: "number", default: 1, description: "Light intensity" },
            diffuse: { type: "Color3", default: [1, 1, 1], description: "Diffuse color" },
            specular: { type: "Color3", default: [1, 1, 1], description: "Specular color" },
            groundColor: { type: "Color3", default: [0, 0, 0], description: "Color reflected from ground" },
        },
    },
    PointLight: {
        description: "An omnidirectional light that emanates from a point. Like a light bulb.",
        className: "PointLight",
        options: {
            position: { type: "Vector3", default: [0, 5, 0], description: "Light position" },
            intensity: { type: "number", default: 1, description: "Light intensity" },
            diffuse: { type: "Color3", default: [1, 1, 1], description: "Diffuse color" },
            specular: { type: "Color3", default: [1, 1, 1], description: "Specular color" },
            range: { type: "number", default: 100, description: "Light range (distance)" },
        },
    },
    DirectionalLight: {
        description: "A light that shines in a direction from infinitely far away. Like sunlight.",
        className: "DirectionalLight",
        options: {
            direction: { type: "Vector3", default: [0, -1, 0], description: "Direction the light shines" },
            position: { type: "Vector3", default: [0, 10, 0], description: "Position (for shadow generation)" },
            intensity: { type: "number", default: 1, description: "Light intensity" },
            diffuse: { type: "Color3", default: [1, 1, 1], description: "Diffuse color" },
            specular: { type: "Color3", default: [1, 1, 1], description: "Specular color" },
            shadowEnabled: { type: "boolean", default: false, description: "Whether this light casts shadows" },
            shadowMapSize: { type: "number", default: 1024, description: "Shadow map resolution" },
        },
    },
    SpotLight: {
        description: "A cone-shaped light. Like a spotlight or flashlight.",
        className: "SpotLight",
        options: {
            position: { type: "Vector3", default: [0, 10, 0], description: "Light position" },
            direction: { type: "Vector3", default: [0, -1, 0], description: "Cone direction" },
            angle: { type: "number", default: Math.PI / 3, description: "Cone angle (radians)" },
            exponent: { type: "number", default: 2, description: "Light decay exponent" },
            intensity: { type: "number", default: 1, description: "Light intensity" },
            diffuse: { type: "Color3", default: [1, 1, 1], description: "Diffuse color" },
            specular: { type: "Color3", default: [1, 1, 1], description: "Specular color" },
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Material presets (quick materials — not node materials)
// ═══════════════════════════════════════════════════════════════════════════

/**
 *
 */
export interface IMaterialPresetInfo {
    /** Human-readable description */
    description: string;
    /** Babylon.js class name */
    className: string;
    /** Available creation options with their types and defaults */
    options: Record<
        string,
        {
            type: string;
            default?: unknown;
            description: string;
        }
    >;
}

export const MaterialPresets: Record<string, IMaterialPresetInfo> = {
    StandardMaterial: {
        description: "Babylon.js standard Phong-Blinn material. Simple, fast, and widely compatible.",
        className: "StandardMaterial",
        options: {
            diffuseColor: { type: "Color3", default: [1, 1, 1], description: "Base diffuse color" },
            specularColor: { type: "Color3", default: [1, 1, 1], description: "Specular highlight color" },
            emissiveColor: { type: "Color3", default: [0, 0, 0], description: "Self-illumination color" },
            ambientColor: { type: "Color3", default: [0, 0, 0], description: "Ambient color" },
            alpha: { type: "number", default: 1, description: "Transparency (0=invisible, 1=opaque)" },
            specularPower: { type: "number", default: 64, description: "Specular highlight sharpness" },
            backFaceCulling: { type: "boolean", default: true, description: "Whether to cull back faces" },
            wireframe: { type: "boolean", default: false, description: "Wireframe rendering" },
            diffuseTexture: { type: "string", description: "URL of diffuse texture" },
            bumpTexture: { type: "string", description: "URL of normal map texture" },
            specularTexture: { type: "string", description: "URL of specular texture" },
            emissiveTexture: { type: "string", description: "URL of emissive texture" },
            opacityTexture: { type: "string", description: "URL of opacity texture" },
        },
    },
    PBRMaterial: {
        description: "Physically-based rendering material. Realistic lighting, metallic-roughness workflow.",
        className: "PBRMaterial",
        options: {
            albedoColor: { type: "Color3", default: [1, 1, 1], description: "Base albedo color" },
            metallic: { type: "number", default: 0, description: "Metallic factor (0=dielectric, 1=metal)" },
            roughness: { type: "number", default: 1, description: "Roughness factor (0=mirror, 1=rough)" },
            alpha: { type: "number", default: 1, description: "Transparency" },
            emissiveColor: { type: "Color3", default: [0, 0, 0], description: "Emissive color" },
            emissiveIntensity: { type: "number", default: 1, description: "Emissive intensity" },
            albedoTexture: { type: "string", description: "URL of albedo texture" },
            metallicTexture: { type: "string", description: "URL of metallic-roughness texture (ORM)" },
            bumpTexture: { type: "string", description: "URL of normal map texture" },
            emissiveTexture: { type: "string", description: "URL of emissive texture" },
            environmentTexture: { type: "string", description: "URL of HDR environment texture (.env or .hdr)" },
            useRadianceOverAlpha: { type: "boolean", default: true, description: "Radiance over alpha for transparency" },
            backFaceCulling: { type: "boolean", default: true, description: "Whether to cull back faces" },
        },
    },
    NodeMaterial: {
        description: "A material created from a Node Material Editor JSON. Use import_nme_material to load NME JSON.",
        className: "NodeMaterial",
        options: {
            nmeJson: { type: "string", description: "The NME JSON string (exported from the NME MCP server)" },
            snippetId: { type: "string", description: "Snippet ID from the Babylon.js Snippet Server" },
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Animation types
// ═══════════════════════════════════════════════════════════════════════════

export const AnimatableProperties: Record<
    string,
    {
        /** Value type name */
        type: string;
        /** Human-readable description */
        description: string;
        /** Animation type identifier */
        animationType: number;
        /** Data type identifier */
        dataType: number;
    }
> = {
    position: { type: "Vector3", description: "Mesh position", animationType: 0, dataType: 1 },
    "position.x": { type: "number", description: "X position", animationType: 0, dataType: 0 },
    "position.y": { type: "number", description: "Y position", animationType: 0, dataType: 0 },
    "position.z": { type: "number", description: "Z position", animationType: 0, dataType: 0 },
    rotation: { type: "Vector3", description: "Mesh rotation (Euler)", animationType: 0, dataType: 1 },
    "rotation.x": { type: "number", description: "X rotation", animationType: 0, dataType: 0 },
    "rotation.y": { type: "number", description: "Y rotation", animationType: 0, dataType: 0 },
    "rotation.z": { type: "number", description: "Z rotation", animationType: 0, dataType: 0 },
    rotationQuaternion: { type: "Quaternion", description: "Mesh rotation (quaternion)", animationType: 0, dataType: 2 },
    scaling: { type: "Vector3", description: "Mesh scaling", animationType: 0, dataType: 1 },
    "scaling.x": { type: "number", description: "X scale", animationType: 0, dataType: 0 },
    "scaling.y": { type: "number", description: "Y scale", animationType: 0, dataType: 0 },
    "scaling.z": { type: "number", description: "Z scale", animationType: 0, dataType: 0 },
    visibility: { type: "number", description: "Mesh visibility (0-1)", animationType: 0, dataType: 0 },
    "material.diffuseColor": { type: "Color3", description: "Material diffuse color", animationType: 0, dataType: 3 },
    "material.alpha": { type: "number", description: "Material alpha", animationType: 0, dataType: 0 },
    intensity: { type: "number", description: "Light intensity", animationType: 0, dataType: 0 },
    diffuse: { type: "Color3", description: "Light diffuse color", animationType: 0, dataType: 3 },
};

// Animation loop modes
export const AnimationLoopModes: Record<string, number> = {
    Relative: 0,
    Cycle: 1,
    Constant: 2,
    Yoyo: 4,
};

// Animation data types
export const AnimationDataTypes: Record<string, number> = {
    Float: 0,
    Vector3: 1,
    Quaternion: 2,
    Color3: 3,
    Color4: 4,
    Vector2: 5,
};

// ═══════════════════════════════════════════════════════════════════════════
//  Physics body types
// ═══════════════════════════════════════════════════════════════════════════

export const PhysicsBodyTypes: Record<string, number> = {
    Static: 0,
    Animated: 1,
    Dynamic: 2,
};

export const PhysicsShapeTypes: Record<string, string> = {
    Box: "PhysicsShapeBox",
    Sphere: "PhysicsShapeSphere",
    Capsule: "PhysicsShapeCapsule",
    Cylinder: "PhysicsShapeCylinder",
    ConvexHull: "PhysicsShapeConvexHull",
    Mesh: "PhysicsShapeMesh",
    Container: "PhysicsShapeContainer",
};

// ═══════════════════════════════════════════════════════════════════════════
//  Particle emitter types
// ═══════════════════════════════════════════════════════════════════════════

export const ParticleEmitterTypes: Record<
    string,
    {
        /** Human-readable description */
        description: string;
        /** Available creation options with their types and defaults */
        options: Record<
            string,
            {
                /** Value type name */
                type: string;
                /** Default value */
                default?: unknown;
                /** Human-readable description */
                description: string;
            }
        >;
    }
> = {
    Box: {
        description: "Emits particles from a box volume defined by minEmitBox and maxEmitBox.",
        options: {
            direction1: { type: "Vector3", default: [0, 1, 0], description: "Min emit direction" },
            direction2: { type: "Vector3", default: [0, 1, 0], description: "Max emit direction" },
            minEmitBox: { type: "Vector3", default: [-0.5, -0.5, -0.5], description: "Min corner of emission box" },
            maxEmitBox: { type: "Vector3", default: [0.5, 0.5, 0.5], description: "Max corner of emission box" },
        },
    },
    Sphere: {
        description: "Emits particles from a sphere volume.",
        options: {
            radius: { type: "number", default: 1, description: "Sphere radius" },
            radiusRange: { type: "number", default: 1, description: "Range within the radius (0=surface, 1=full volume)" },
            directionRandomizer: { type: "number", default: 0, description: "Randomization of emit direction" },
        },
    },
    Cone: {
        description: "Emits particles from a cone shape (great for fire, fountains).",
        options: {
            radius: { type: "number", default: 1, description: "Cone base radius" },
            angle: { type: "number", default: 3.14159, description: "Cone angle in radians" },
            directionRandomizer: { type: "number", default: 0, description: "Randomization of emit direction" },
            radiusRange: { type: "number", default: 1, description: "Range within the radius" },
            heightRange: { type: "number", default: 1, description: "Range within the height" },
        },
    },
    Cylinder: {
        description: "Emits particles from a cylinder volume.",
        options: {
            radius: { type: "number", default: 1, description: "Cylinder radius" },
            height: { type: "number", default: 1, description: "Cylinder height" },
            radiusRange: { type: "number", default: 1, description: "Range within the radius" },
            directionRandomizer: { type: "number", default: 0, description: "Randomization factor" },
        },
    },
    Hemisphere: {
        description: "Emits particles from a hemisphere shape.",
        options: {
            radius: { type: "number", default: 1, description: "Hemisphere radius" },
            radiusRange: { type: "number", default: 1, description: "Range within the radius" },
            directionRandomizer: { type: "number", default: 0, description: "Randomization factor" },
        },
    },
    Point: {
        description: "Emits particles from a single point.",
        options: {
            direction1: { type: "Vector3", default: [0, 1, 0], description: "Min emit direction" },
            direction2: { type: "Vector3", default: [0, 1, 0], description: "Max emit direction" },
        },
    },
};

export const ParticleBlendModes: Record<string, number> = {
    OneOne: 0,
    Standard: 1,
    Add: 2,
    Multiply: 3,
    MultiplyAdd: 4,
    Subtract: -1,
};

// ═══════════════════════════════════════════════════════════════════════════
//  Physics constraint types
// ═══════════════════════════════════════════════════════════════════════════

export const PhysicsConstraintTypes: Record<
    string,
    {
        /** Human-readable description */
        description: string;
        /** Numeric constraint type value */
        value: number;
    }
> = {
    BallAndSocket: { description: "Ball-and-socket joint allowing rotation in all directions.", value: 1 },
    Distance: { description: "Constrains two bodies to be within a max distance.", value: 2 },
    Hinge: { description: "Hinge joint allowing rotation around a single axis.", value: 3 },
    Slider: { description: "Allows sliding along an axis with optional limits.", value: 4 },
    Lock: { description: "Locks two bodies together rigidly.", value: 5 },
    Prismatic: { description: "Like slider but more configurable.", value: 6 },
    Spring: { description: "Spring constraint with stiffness and damping.", value: 7 },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Post-process / Rendering pipeline presets
// ═══════════════════════════════════════════════════════════════════════════

export const PostProcessEffects: Record<
    string,
    {
        /** Human-readable description */
        description: string;
        /** Available properties with their types and defaults */
        properties: Record<
            string,
            {
                /** Value type name */
                type: string;
                /** Default value */
                default?: unknown;
                /** Human-readable description */
                description: string;
            }
        >;
    }
> = {
    bloom: {
        description: "Bloom (glow) effect — bright areas bleed light outward.",
        properties: {
            bloomEnabled: { type: "boolean", default: false, description: "Enable bloom" },
            bloomKernel: { type: "number", default: 64, description: "Blur kernel size" },
            bloomWeight: { type: "number", default: 0.15, description: "Bloom intensity" },
            bloomThreshold: { type: "number", default: 0.9, description: "Brightness threshold for bloom" },
            bloomScale: { type: "number", default: 0.5, description: "Bloom scale" },
        },
    },
    depthOfField: {
        description: "Depth of field blur effect — objects at focal distance are sharp, others blurred.",
        properties: {
            depthOfFieldEnabled: { type: "boolean", default: false, description: "Enable DOF" },
            depthOfFieldBlurLevel: { type: "number", default: 0, description: "Blur level: 0=Low, 1=Medium, 2=High" },
        },
    },
    fxaa: {
        description: "Fast approximate anti-aliasing to smooth jagged edges.",
        properties: {
            fxaaEnabled: { type: "boolean", default: false, description: "Enable FXAA" },
        },
    },
    sharpen: {
        description: "Sharpen convolution filter to enhance edges.",
        properties: {
            sharpenEnabled: { type: "boolean", default: false, description: "Enable sharpen" },
        },
    },
    chromaticAberration: {
        description: "Simulates lens chromatic aberration (color fringing).",
        properties: {
            chromaticAberrationEnabled: { type: "boolean", default: false, description: "Enable chromatic aberration" },
        },
    },
    grain: {
        description: "Film grain overlay for cinematic effect.",
        properties: {
            grainEnabled: { type: "boolean", default: false, description: "Enable grain" },
        },
    },
    imageProcessing: {
        description: "Tone mapping and color grading.",
        properties: {
            imageProcessingEnabled: { type: "boolean", default: true, description: "Enable image processing" },
        },
    },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Supported model formats
// ═══════════════════════════════════════════════════════════════════════════

export const ModelFormats: Record<
    string,
    {
        /** File extensions for this format */
        extensions: string[];
        /** Human-readable description */
        description: string;
    }
> = {
    glTF: { extensions: [".gltf", ".glb"], description: "GL Transmission Format — the recommended 3D format for Babylon.js" },
    OBJ: { extensions: [".obj"], description: "Wavefront OBJ — simple mesh format" },
    STL: { extensions: [".stl"], description: "Stereolithography — common for 3D printing" },
    Splat: { extensions: [".splat", ".ply"], description: "Gaussian splatting format" },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Summary helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Returns a formatted summary of available particle emitter types.
 * @returns A bullet-list summary string
 */
export function GetParticleEmitterTypesSummary(): string {
    return Object.entries(ParticleEmitterTypes)
        .map(([name, info]) => `  • ${name}: ${info.description.split(".")[0]}`)
        .join("\n");
}

/**
 * Returns a formatted summary of available physics constraint types.
 * @returns A bullet-list summary string
 */
export function GetPhysicsConstraintTypesSummary(): string {
    return Object.entries(PhysicsConstraintTypes)
        .map(([name, info]) => `  • ${name}: ${info.description.split(".")[0]}`)
        .join("\n");
}

/**
 * Returns a formatted summary of available post-process effects.
 * @returns A bullet-list summary string
 */
export function GetPostProcessEffectsSummary(): string {
    return Object.entries(PostProcessEffects)
        .map(([name, info]) => `  • ${name}: ${info.description.split(".")[0]}`)
        .join("\n");
}

/**
 * Returns a formatted summary of available mesh primitive types.
 * @returns A bullet-list summary string
 */
export function GetMeshPrimitivesSummary(): string {
    return Object.entries(MeshPrimitives)
        .map(([name, info]) => `  • ${name}: ${info.description.split(".")[0]}`)
        .join("\n");
}

/**
 * Returns a formatted summary of available camera types.
 * @returns A bullet-list summary string
 */
export function GetCameraTypesSummary(): string {
    return Object.entries(CameraTypes)
        .map(([name, info]) => `  • ${name}: ${info.description.split(".")[0]}`)
        .join("\n");
}

/**
 * Returns a formatted summary of available light types.
 * @returns A bullet-list summary string
 */
export function GetLightTypesSummary(): string {
    return Object.entries(LightTypes)
        .map(([name, info]) => `  • ${name}: ${info.description.split(".")[0]}`)
        .join("\n");
}

/**
 * Returns a formatted summary of available material presets.
 * @returns A bullet-list summary string
 */
export function GetMaterialPresetsSummary(): string {
    return Object.entries(MaterialPresets)
        .map(([name, info]) => `  • ${name}: ${info.description.split(".")[0]}`)
        .join("\n");
}

/**
 * Returns a formatted summary of animatable properties.
 * @returns A bullet-list summary string
 */
export function GetAnimatablePropertiesSummary(): string {
    return Object.entries(AnimatableProperties)
        .map(([name, info]) => `  • ${name} (${info.type}): ${info.description}`)
        .join("\n");
}
