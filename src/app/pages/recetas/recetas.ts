import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CoffeeService, CoffeeDrink } from '../../services/coffee.service';

export interface RecomendacionCaxambu {
  nombre: string;
  tipo: string;
  notas: string[];
  porQue: string;
  imagen: string;
}

export interface RecetaDetallada {
  id: number;
  title: string;
  description: string;
  ingredients: string[];
  image: string;
  category: 'todos' | 'espressos' | 'leche' | 'especiales';
  categoryLabel: string;
  gramaje: string;
  molienda: string;
  ratio: string;
  tiempo: string;
  temperatura: string;
  productoRecomendado: RecomendacionCaxambu;
  ingredientesDetallados: string[];
  pasos: string[];
  tipBarista: string;
}

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recetas.html',
  styleUrl: './recetas.css'
})
export class Recetas implements OnInit {
  private coffeeService = inject(CoffeeService);

  searchControl = new FormControl('');
  categoriaSeleccionada = signal<'todos' | 'espressos' | 'leche' | 'especiales'>('todos');
  
  todasLasRecetas = signal<RecetaDetallada[]>([]);
  recetaSeleccionada = signal<RecetaDetallada | null>(null);

  cargando = signal(true);
  error = signal(false);

  // Recetas filtradas según búsqueda y categoría
  recetasFiltradas = computed(() => {
    const busqueda = (this.searchControl.value || '').toLowerCase().trim();
    const categoria = this.categoriaSeleccionada();

    return this.todasLasRecetas().filter(receta => {
      const coincideCategoria = categoria === 'todos' || receta.category === categoria;
      const coincideBusqueda = !busqueda || 
        receta.title.toLowerCase().includes(busqueda) ||
        receta.ingredients.some(i => i.toLowerCase().includes(busqueda)) ||
        receta.productoRecomendado.nombre.toLowerCase().includes(busqueda);

      return coincideCategoria && coincideBusqueda;
    });
  });

  ngOnInit() {
    this.cargarRecetas();

    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(() => {
      // Al filtrar, si la seleccionada ya no está en la lista, selecciona la primera visible
      const filtradas = this.recetasFiltradas();
      if (filtradas.length > 0 && (!this.recetaSeleccionada() || !filtradas.some(r => r.id === this.recetaSeleccionada()?.id))) {
        this.recetaSeleccionada.set(filtradas[0]);
      }
    });
  }

  cargarRecetas() {
    this.cargando.set(true);
    this.coffeeService.getCoffees().subscribe({
      next: (coffees) => {
        const enriquecidas = coffees.map(c => this.enriquecerReceta(c));
        this.todasLasRecetas.set(enriquecidas);
        if (enriquecidas.length > 0) {
          this.recetaSeleccionada.set(enriquecidas[0]);
        }
        this.cargando.set(false);
      },
      error: () => {
        // En caso de falla en la API externa, usamos catálogo de respaldo curado por Caxambú
        const fallback = this.obtenerRecetasRespaldo();
        this.todasLasRecetas.set(fallback);
        this.recetaSeleccionada.set(fallback[0]);
        this.cargando.set(false);
      }
    });
  }

  seleccionarReceta(receta: RecetaDetallada) {
    this.recetaSeleccionada.set(receta);
  }

  cambiarCategoria(cat: 'todos' | 'espressos' | 'leche' | 'especiales') {
    this.categoriaSeleccionada.set(cat);
    const filtradas = this.recetasFiltradas();
    if (filtradas.length > 0) {
      this.recetaSeleccionada.set(filtradas[0]);
    }
  }

  limpiarBusqueda() {
    this.searchControl.setValue('');
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/assets/img/gallery1.jpg';
  }

  private enriquecerReceta(base: CoffeeDrink): RecetaDetallada {
    const t = base.title.toLowerCase();
    
    // Categorización y metadatos
    let category: 'todos' | 'espressos' | 'leche' | 'especiales' = 'espressos';
    let categoryLabel = 'Café Puro & Espresso';
    let gramaje = '18g - 20g';
    let molienda = 'Fina (Molienda Espresso)';
    let ratio = '1:2 (18g café -> 36g extracción)';
    let tiempo = '25 a 28 segundos';
    let temperatura = '92°C - 93.5°C';

    let producto: RecomendacionCaxambu = {
      nombre: 'Café Caxambú Colombiano Especial',
      tipo: '100% Arábica de Altura',
      notas: ['Notas cítricas brillantes', 'Frutos rojos', 'Cuerpo medio sedoso'],
      porQue: 'La pureza de este grano resalta la complejidad aromática y acidez limpia que debe predominar en una extracción directa.',
      imagen: '/assets/img/cafe-1.png'
    };

    let ingredientesDetallados: string[] = [
      '18g café molido de especialidad Caxambú',
      '36ml de agua caliente a presión (shot doble)',
      'Agua filtrada de baja mineralización'
    ];

    let pasos: string[] = [
      'Purgá el grupo y secá cuidadosamente la canasta del portafiltro.',
      'Molé 18g a 20g en molienda fina y distribuí de manera uniforme (técnica WDT).',
      'Aplicá un prensado firme y nivelado (15kg de presión aprox.).',
      'Iniciá la extracción inmediatamente y cortá al alcanzar el ratio deseado en 25-28s.'
    ];

    let tipBarista = 'Revolvé suavemente el espresso con una cucharilla antes de probarlo para amalgamar la crema superficial con el cuerpo de la bebida.';

    if (t.includes('latte') || t.includes('flat white') || t.includes('cortado') || t.includes('macchiato')) {
      category = 'leche';
      categoryLabel = 'Café con Leche & Texturizado';
      gramaje = '18g a 19g';
      molienda = 'Fina para Espresso';
      ratio = '1 shot espresso (36ml) + 180ml leche texturizada';
      tiempo = '26 segundos (extracción) + 15s (vaporizado)';
      temperatura = '92°C agua | 62°C - 65°C leche';

      producto = {
        nombre: 'Café Caxambú Brasilero Selección',
        tipo: '100% Arábica - Proceso Natural',
        notas: ['Chocolate con leche', 'Avellanas tostadas', 'Baja acidez natural'],
        porQue: 'El cuerpo denso y las notas tostadas del grano brasilero equilibran la cremosidad de la leche sin perder intensidad.',
        imagen: '/assets/img/cafe-2.png'
      };

      ingredientesDetallados = [
        '18g de café molido fino Caxambú Brasilero',
        '36ml de espresso doble fresco',
        '180ml a 200ml de leche entera fresca bien fría (o vegetal barista)'
      ];

      pasos = [
        'Extraé un espresso doble directo en una taza precalentada de 250ml.',
        'Verté leche fría en la jarra de acero hasta la base del pico.',
        'Introducí la lanceta apenas bajo la superficie, abrí vapor y emulsioná creando un remolino constante.',
        'Al alcanzar 65°C cortá el vapor, golpeá la jarra suavemente contra la mesa para asentar y verté realizando tu diseño de arte latte.'
      ];

      tipBarista = 'Nunca sobrepases los 68°C al vaporizar la leche; después de esa temperatura las proteínas se desnaturalizan y se pierde el dulzor natural.';

    } else if (t.includes('cappuccino') || t.includes('capuchino')) {
      category = 'leche';
      categoryLabel = 'Clásico Italiano Emulsionado';
      gramaje = '19g';
      molienda = 'Fina compacta';
      ratio = '1:1:1 (30ml espresso, 60ml leche, 60ml espuma densa)';
      tiempo = '25 - 30 segundos';
      temperatura = '93°C agua | 65°C leche';

      producto = {
        nombre: 'Caxambú Flor de Brasil 85/15',
        tipo: 'Blend Espresso Intenso',
        notas: ['Cacao amargo', 'Caramelo oscuro', 'Crema densa y persistente'],
        porQue: 'Su tostado intenso y perfil especiado penetra la densa capa de espuma del capuchino, garantizando presencia cafetera.',
        imagen: '/assets/img/Cafe-Blend.png'
      };

      ingredientesDetallados = [
        '19g café Caxambú Flor de Brasil molido fresco',
        '35ml de espresso concentrado',
        '120ml de leche emulsionada con espuma consistente',
        'Toque opcional: cacao amargo 100% puro espolvoreado'
      ];

      pasos = [
        'Extraé el espresso en el centro de una taza cónica de 180ml.',
        'Inyectá más aire en la leche que para un latte, buscando una espuma elástica y brillante.',
        'Verté con movimiento envolvente para que la espuma quede en el centro coronada por el anillo dorado de crema.'
      ];

      tipBarista = 'Un verdadero capuchino debe sentirse ligero en mano y la espuma debe resistir sosteniendo una capa ligera de cacao.';

    } else if (t.includes('mocha') || t.includes('moca') || t.includes('caramel') || t.includes('irish') || t.includes('affogato')) {
      category = 'especiales';
      categoryLabel = 'Especialidad & Coctelería';
      gramaje = '19g a 20g';
      molienda = 'Fina intensa';
      ratio = '1 shot doble (40g) + complementos dulces / licores';
      tiempo = '27 segundos';
      temperatura = '92°C';

      producto = {
        nombre: 'Caxambú Brasil Moka',
        tipo: 'Tueste Medio Oscuro Especial',
        notas: ['Chocolate semiamargo', 'Panela', 'Vainilla natural'],
        porQue: 'Fue desarrollado para maridar a la perfección con notas de chocolate, cacao puro, toffee o licores sin saturar el paladar.',
        imagen: '/assets/img/Cafe-moka-Brasil.png'
      };

      ingredientesDetallados = [
        '20g café Caxambú Brasil Moka molido fino',
        '40ml de espresso doble espeso',
        '25g salsa de chocolate amargo al 70% o sirope artesanal',
        '150ml de leche texturizada o crema chantilly'
      ];

      pasos = [
        'Colocá la base de chocolate o sirope en el fondo de la taza o vaso térmico.',
        'Extraé el espresso directamente encima e integrá batiendo unos segundos con cuchara.',
        'Completá con leche vaporizada sedosa o corona de crema fresca.'
      ];

      tipBarista = 'Utilizá chocolates y jarabes sin conservantes artificiales para preservar los matices reales del grano de café.';

    } else if (t.includes('black') || t.includes('americano') || t.includes('lungo')) {
      category = 'espressos';
      categoryLabel = 'Café Negro Largo';
      gramaje = '18g';
      molienda = 'Fina a Media-Fina';
      ratio = '36ml espresso + 120ml agua caliente pura';
      tiempo = '25 segundos';
      temperatura = '88°C - 90°C';

      producto = {
        nombre: 'Caxambú Edición Especial 250g',
        tipo: 'Origen Colombiano & Brasilero',
        notas: ['Miel de caña', 'Almendra tostada', 'Final prolongado'],
        porQue: 'Al alargar la bebida con agua caliente, las notas aromáticas dulces florecen en taza sin generar amargor excesivo.',
        imagen: '/assets/img/250g-colombiano-brasil.png'
      };

      ingredientesDetallados = [
        '18g café de especialidad Caxambú',
        '36ml espresso doble recién extraído',
        '120ml agua caliente filtrada (90°C)'
      ];

      pasos = [
        'Agregá primero el agua caliente en la taza (estilo Long Black).',
        'Extraé el espresso directamente sobre el agua para conservar la crema dorada intacta.',
        'Esperá 30 segundos antes del primer sorbo para percibir todos sus aromas florales.'
      ];

      tipBarista = 'Nunca utilices agua hirviendo (100°C) para un americano, ya que cocinará los aceites del espresso y aportará notas a quemado.';
    }

    return {
      id: base.id,
      title: base.title,
      description: base.description || 'Una de las recetas más populares en el mundo del café de especialidad.',
      ingredients: base.ingredients || ['Café', 'Agua'],
      image: base.image,
      category,
      categoryLabel,
      gramaje,
      molienda,
      ratio,
      tiempo,
      temperatura,
      productoRecomendado: producto,
      ingredientesDetallados,
      pasos,
      tipBarista
    };
  }

  private obtenerRecetasRespaldo(): RecetaDetallada[] {
    const rawList: CoffeeDrink[] = [
      {
        id: 1,
        title: 'Espresso Doble',
        description: 'La máxima expresión del café: una extracción corta y concentrada coronada con una crema elástica avellanada.',
        ingredients: ['Café tostado Caxambú', 'Agua a presión'],
        image: '/assets/img/expreso-category.jpg'
      },
      {
        id: 2,
        title: 'Café Latte',
        description: 'Bebida suave y reconfortante que combina un espresso doble con abundante leche vaporizada y sutil microespuma.',
        ingredients: ['Espresso doble', 'Leche vaporizada', 'Microespuma sedosa'],
        image: '/assets/img/cafe-1.png'
      },
      {
        id: 3,
        title: 'Cappuccino Italiano',
        description: 'El clásico de los baristas con tres partes simétricas: espresso denso, leche dulce y una corona de espuma compacta.',
        ingredients: ['Espresso', 'Leche vaporizada', 'Espuma densa', 'Cacao'],
        image: '/assets/img/capuchino-category.jpg'
      },
      {
        id: 4,
        title: 'Café Mocha',
        description: 'Fusión irresistible entre el carácter amargo del café de especialidad y la untuosidad del chocolate artesanal.',
        ingredients: ['Espresso doble', 'Chocolate amargo 70%', 'Leche vaporizada'],
        image: '/assets/img/moca-category.jpg'
      },
      {
        id: 5,
        title: 'Americano Clásico',
        description: 'La sobriedad del café negro con agua caliente filtrada, ideal para apreciar notas dulces y florales de fondo.',
        ingredients: ['Espresso doble', 'Agua caliente filtrada'],
        image: '/assets/img/gallery3.jpg'
      },
      {
        id: 6,
        title: 'Flat White',
        description: 'Especialidad australiana con doble ristretto corto y leche emulsionada de microtextura sedosa.',
        ingredients: ['Doble ristretto', 'Microespuma sedosa'],
        image: '/assets/img/cafe-australiano.jpg'
      },
      {
        id: 7,
        title: 'Caramel Macchiato',
        description: 'Espresso vertido en capas sobre leche emulsionada y terminado con una espiral de caramelo artesanal.',
        ingredients: ['Espresso', 'Leche texturizada', 'Sirope de vainilla', 'Caramelo'],
        image: '/assets/img/cafe-helado.jpg'
      },
      {
        id: 8,
        title: 'Café Vienés',
        description: 'Espresso intenso suavizado y coronado por una generosa porción de crema batida y chocolate rallado.',
        ingredients: ['Espresso', 'Crema batida fresca', 'Chocolate rallado'],
        image: '/assets/img/cafe-viena.jpg'
      }
    ];

    return rawList.map(c => this.enriquecerReceta(c));
  }
}
